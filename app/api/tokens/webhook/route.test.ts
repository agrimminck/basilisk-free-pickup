import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const state: {
  purchasesById: Record<number, { id: number; profileId: string; tokensPurchased: number; status: string }>;
  updates: Array<{ id: number; patch: { status?: string; mpPaymentId?: string } }>;
  tokensAdded: Array<{ profileId: string; amount: number }>;
  fetchImpl: (url: string) => Promise<Response>;
} = {
  purchasesById: {},
  updates: [],
  tokensAdded: [],
  fetchImpl: async () => new Response("{}", { status: 200 }),
};

vi.mock("../../../../lib/tokens", () => ({
  addTokens: vi.fn(async (profileId: string, amount: number) => {
    state.tokensAdded.push({ profileId, amount });
  }),
}));

vi.mock("../../../../lib/db", () => ({
  db: {
    query: {
      tokenPurchases: {
        findFirst: async (opts: { where: { __value: number } }) =>
          state.purchasesById[opts.where.__value] ?? null,
      },
    },
    update: (_t: unknown) => ({
      set: (patch: { status?: string; mpPaymentId?: string }) => ({
        where: async (pred: { __value: number }) => {
          state.updates.push({ id: pred.__value, patch });
          // also reflect into store so subsequent reads see "completed"
          const p = state.purchasesById[pred.__value];
          if (p && patch.status) p.status = patch.status;
        },
      }),
    }),
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb({
        update: (_t: unknown) => ({
          set: (patch: { status?: string; mpPaymentId?: string }) => ({
            where: async (pred: { __value: number }) => {
              state.updates.push({ id: pred.__value, patch });
              const p = state.purchasesById[pred.__value];
              if (p && patch.status) p.status = patch.status;
            },
          }),
        }),
      });
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (_col: unknown, value: unknown) => ({ __value: value }),
}));

vi.mock("../../../../db/schema", () => ({
  tokenPurchases: { id: {} },
}));

beforeEach(() => {
  process.env.MERCADOPAGO_ACCESS_TOKEN = "test-token";
  state.purchasesById = {};
  state.updates = [];
  state.tokensAdded = [];
  vi.stubGlobal("fetch", vi.fn(((url: string) => state.fetchImpl(url)) as typeof fetch));
});

async function loadRoute() {
  return await import("./route");
}

function ipn(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tokens/webhook", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/tokens/webhook (MP IPN)", () => {
  it("returns 200 for unparseable body", async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/tokens/webhook", {
        method: "POST",
        body: "not json",
      })
    );
    expect(res.status).toBe(200);
  });

  it("returns 200 for missing type/data", async () => {
    const { POST } = await loadRoute();
    const res = await POST(ipn({ foo: "bar" }));
    expect(res.status).toBe(200);
    expect(state.tokensAdded).toEqual([]);
  });

  it("approved payment credits tokens once and marks purchase completed", async () => {
    state.purchasesById[42] = { id: 42, profileId: "p1", tokensPurchased: 10, status: "pending" };
    state.fetchImpl = async () =>
      new Response(JSON.stringify({ status: "approved", external_reference: "42" }), { status: 200 });
    const { POST } = await loadRoute();
    const res = await POST(ipn({ type: "payment", data: { id: "MP-PAY-123" } }));
    expect(res.status).toBe(200);
    expect(state.tokensAdded).toEqual([{ profileId: "p1", amount: 10 }]);
    expect(state.updates.some((u) => u.patch.status === "completed")).toBe(true);
  });

  it("IDEMPOTENCY: duplicate approved IPN for already-completed purchase does NOT double-credit", async () => {
    state.purchasesById[42] = { id: 42, profileId: "p1", tokensPurchased: 10, status: "completed" };
    state.fetchImpl = async () =>
      new Response(JSON.stringify({ status: "approved", external_reference: "42" }), { status: 200 });
    const { POST } = await loadRoute();
    await POST(ipn({ type: "payment", data: { id: "MP-PAY-123" } }));
    await POST(ipn({ type: "payment", data: { id: "MP-PAY-123" } }));
    expect(state.tokensAdded).toEqual([]);
  });

  it("rejected payment transitions pending purchase to failed", async () => {
    state.purchasesById[7] = { id: 7, profileId: "p1", tokensPurchased: 5, status: "pending" };
    state.fetchImpl = async () =>
      new Response(JSON.stringify({ status: "rejected", external_reference: "7" }), { status: 200 });
    const { POST } = await loadRoute();
    await POST(ipn({ type: "payment", data: { id: "MP-X" } }));
    expect(state.updates.some((u) => u.patch.status === "failed")).toBe(true);
    expect(state.tokensAdded).toEqual([]);
  });

  it("rejected payment does NOT downgrade an already-completed purchase", async () => {
    state.purchasesById[7] = { id: 7, profileId: "p1", tokensPurchased: 5, status: "completed" };
    state.fetchImpl = async () =>
      new Response(JSON.stringify({ status: "rejected", external_reference: "7" }), { status: 200 });
    const { POST } = await loadRoute();
    await POST(ipn({ type: "payment", data: { id: "MP-X" } }));
    expect(state.updates).toHaveLength(0);
  });

  it("silently 200s when MP API call fails (no purchase mutation)", async () => {
    state.purchasesById[42] = { id: 42, profileId: "p1", tokensPurchased: 10, status: "pending" };
    state.fetchImpl = async () => new Response("mp down", { status: 500 });
    const { POST } = await loadRoute();
    const res = await POST(ipn({ type: "payment", data: { id: "MP-X" } }));
    expect(res.status).toBe(200);
    expect(state.tokensAdded).toEqual([]);
    expect(state.updates).toEqual([]);
  });

  it("returns 200 when purchaseId not found in DB", async () => {
    state.fetchImpl = async () =>
      new Response(JSON.stringify({ status: "approved", external_reference: "9999" }), { status: 200 });
    const { POST } = await loadRoute();
    const res = await POST(ipn({ type: "payment", data: { id: "MP-X" } }));
    expect(res.status).toBe(200);
    expect(state.tokensAdded).toEqual([]);
  });

  it("RACE FLAG: two simultaneous approved IPNs against same pending purchase can both pass the status guard (currently no row lock)", async () => {
    // Documenting non-atomic check-then-act: if guarded by SELECT then UPDATE
    // without row lock or unique constraint on completed state, two parallel
    // workers could both pass status !== 'completed' and double-credit.
    state.purchasesById[42] = { id: 42, profileId: "p1", tokensPurchased: 10, status: "pending" };
    state.fetchImpl = async () =>
      new Response(JSON.stringify({ status: "approved", external_reference: "42" }), { status: 200 });
    const { POST } = await loadRoute();
    // Sequential calls (not truly parallel since our fake DB applies mutations
    // synchronously after first call), so verify normal idempotency holds.
    await POST(ipn({ type: "payment", data: { id: "MP-DUP" } }));
    await POST(ipn({ type: "payment", data: { id: "MP-DUP" } }));
    expect(state.tokensAdded).toEqual([{ profileId: "p1", amount: 10 }]);
  });
});
