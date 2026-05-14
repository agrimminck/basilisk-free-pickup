import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---- Mocks ----
const session = { user: { id: "u1" } as { id: string } | null };

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("../../../lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => (session.user ? session : null)),
    },
  },
}));

// In-memory DB state
const state: {
  profilesByUserId: Record<string, { id: string; fullName: string }>;
  profilesById: Record<string, { id: string; fullName: string; tokensBalance: number; freeMatchesUsed: number; freeMatchesResetAt: Date | null }>;
  itemsById: Record<number, { id: number }>;
  matchInsertShouldFail: boolean;
  matches: Array<{ id: number; requesterId: string; recipientId: string; itemId: number | null; matchType: string; status: string; tokenCost: number }>;
  nextMatchId: number;
} = {
  profilesByUserId: {},
  profilesById: {},
  itemsById: {},
  matchInsertShouldFail: false,
  matches: [],
  nextMatchId: 1,
};

const spendCalls: Array<{ profileId: string; matchId: number }> = [];

vi.mock("../../../lib/tokens", () => ({
  canSpendMatchToken: vi.fn(async (_id: string) => true),
  spendMatchToken: vi.fn(async (profileId: string, matchId: number) => {
    spendCalls.push({ profileId, matchId });
    return { usedFree: true };
  }),
}));

// Capture which table is being inserted/queried.
function makeFakeDb() {
  return {
    query: {
      profiles: {
        findFirst: async (opts: { where?: { __kind?: string; __value?: string } }) => {
          const kind = opts.where?.__kind;
          const value = opts.where?.__value as string | undefined;
          if (kind === "by_user_id") return state.profilesByUserId[value!] ?? null;
          if (kind === "by_id") return state.profilesById[value!] ?? null;
          return null;
        },
      },
      matches: {
        findMany: async () => state.matches,
      },
      items: {
        findFirst: async (opts: { where?: { __value?: number } }) => {
          const id = opts.where?.__value;
          return id ? state.itemsById[id] ?? null : null;
        },
      },
    },
    insert: (_table: unknown) => ({
      values: (vals: { requesterId: string; recipientId: string; itemId: number | null; matchType: string }) => ({
        returning: async () => {
          if (state.matchInsertShouldFail) {
            throw new Error("insert failed");
          }
          const m = {
            id: state.nextMatchId++,
            requesterId: vals.requesterId,
            recipientId: vals.recipientId,
            itemId: vals.itemId ?? null,
            matchType: vals.matchType,
            status: "pending",
            tokenCost: 1,
          };
          state.matches.push(m);
          return [m];
        },
      }),
    }),
  };
}

vi.mock("../../../lib/db", () => ({ db: makeFakeDb() }));

// drizzle helpers — we encode `where` as inspectable objects.
vi.mock("drizzle-orm", () => {
  const eq = (col: { __name: string }, value: unknown) => {
    const map: Record<string, string> = {
      profiles_user_id: "by_user_id",
      profiles_id: "by_id",
      items_id: "items_by_id",
    };
    return { __kind: map[col.__name] ?? col.__name, __value: value };
  };
  const or = (...preds: unknown[]) => ({ __kind: "or", preds });
  const and = (...preds: unknown[]) => ({ __kind: "and", preds });
  return { eq, or, and };
});

vi.mock("../../../db/schema", () => ({
  matches: { id: { __name: "matches_id" }, requesterId: { __name: "matches_requester_id" }, recipientId: { __name: "matches_recipient_id" } },
  profiles: { id: { __name: "profiles_id" }, userId: { __name: "profiles_user_id" } },
  items: { id: { __name: "items_id" } },
}));

// Now import the route under test (after mocks).
async function loadRoute() {
  return await import("./route");
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/matches", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/matches", () => {
  beforeEach(() => {
    state.profilesByUserId = {};
    state.profilesById = {};
    state.itemsById = {};
    state.matches = [];
    state.matchInsertShouldFail = false;
    state.nextMatchId = 1;
    spendCalls.length = 0;
    session.user = { id: "u1" };
  });

  it("returns 401 when unauthenticated", async () => {
    session.user = null;
    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ recipientId: "p2", matchType: "donante_fletero" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when matchType missing", async () => {
    const { POST } = await loadRoute();
    state.profilesByUserId["u1"] = { id: "p1", fullName: "Req" };
    const res = await POST(makeRequest({ recipientId: "p2" }));
    expect(res.status).toBe(400);
  });

  it("returns 402 when canSpendMatchToken=false", async () => {
    const tokens = await import("../../../lib/tokens");
    (tokens.canSpendMatchToken as unknown as { mockResolvedValueOnce: (v: boolean) => void }).mockResolvedValueOnce(false);
    state.profilesByUserId["u1"] = { id: "p1", fullName: "Req" };
    state.profilesById["p2"] = { id: "p2", fullName: "Rec", tokensBalance: 0, freeMatchesUsed: 0, freeMatchesResetAt: null };
    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ recipientId: "p2", matchType: "donante_fletero" }));
    expect(res.status).toBe(402);
  });

  it("rejects self-match with 400", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "Req" };
    state.profilesById["p1"] = { id: "p1", fullName: "Req", tokensBalance: 0, freeMatchesUsed: 0, freeMatchesResetAt: null };
    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ recipientId: "p1", matchType: "donante_fletero" }));
    expect(res.status).toBe(400);
  });

  it("creates match then spends token (token debit AFTER insert)", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "Req" };
    state.profilesById["p2"] = { id: "p2", fullName: "Rec", tokensBalance: 0, freeMatchesUsed: 0, freeMatchesResetAt: null };
    const { POST } = await loadRoute();
    const res = await POST(makeRequest({ recipientId: "p2", matchType: "donante_fletero" }));
    expect(res.status).toBe(201);
    expect(state.matches).toHaveLength(1);
    expect(spendCalls).toHaveLength(1);
    expect(spendCalls[0].matchId).toBe(state.matches[0].id);
  });

  it("BUG FLAG: if match insert succeeds but spendMatchToken throws, match row already exists (no rollback)", async () => {
    // This documents the current non-atomic behavior. Refactor target: wrap in tx.
    state.profilesByUserId["u1"] = { id: "p1", fullName: "Req" };
    state.profilesById["p2"] = { id: "p2", fullName: "Rec", tokensBalance: 0, freeMatchesUsed: 0, freeMatchesResetAt: null };
    const tokens = await import("../../../lib/tokens");
    (tokens.spendMatchToken as unknown as { mockRejectedValueOnce: (e: Error) => void }).mockRejectedValueOnce(
      new Error("DB blew up after insert")
    );
    const { POST } = await loadRoute();
    await expect(
      POST(makeRequest({ recipientId: "p2", matchType: "donante_fletero" }))
    ).rejects.toThrow();
    // Orphan match exists — flagging the inconsistency.
    expect(state.matches).toHaveLength(1);
  });
});
