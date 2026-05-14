import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const session = { user: { id: "u1" } as { id: string } | null };

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

vi.mock("../../../lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => (session.user ? session : null)) } },
}));

const state: {
  profilesByUserId: Record<string, { id: string; fullName: string }>;
  matchesById: Record<number, { id: number; requesterId: string; recipientId: string; status: string }>;
  existingReview: { id: number; matchId: number; reviewerId: string } | null;
  inserted: Array<{ matchId: number; reviewerId: string; revieweeId: string; rating: number; comment: string | null }>;
  recalcCalled: string | null;
} = {
  profilesByUserId: {},
  matchesById: {},
  existingReview: null,
  inserted: [],
  recalcCalled: null,
};

vi.mock("../../../lib/tokens", () => ({
  recalculateAverageRating: vi.fn(async (id: string) => {
    state.recalcCalled = id;
  }),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    query: {
      profiles: {
        findFirst: async (opts: { where: { __value: string } }) =>
          state.profilesByUserId[opts.where.__value] ?? null,
      },
      matches: {
        findFirst: async (opts: { where: { __value: number } }) =>
          state.matchesById[opts.where.__value] ?? null,
      },
      reviews: {
        findFirst: async () => state.existingReview,
      },
    },
    insert: (_t: unknown) => ({
      values: (v: typeof state.inserted[number]) => ({
        returning: async () => {
          state.inserted.push(v);
          return [{ id: state.inserted.length, ...v }];
        },
      }),
    }),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (_col: unknown, value: unknown) => ({ __value: value }),
  and: (...preds: unknown[]) => ({ __preds: preds }),
}));

vi.mock("../../../db/schema", () => ({
  reviews: { matchId: {}, reviewerId: {}, revieweeId: {} },
  matches: { id: {} },
  profiles: { userId: {}, id: {} },
}));

async function loadRoute() {
  return await import("./route");
}

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/reviews", () => {
  beforeEach(() => {
    state.profilesByUserId = {};
    state.matchesById = {};
    state.existingReview = null;
    state.inserted = [];
    state.recalcCalled = null;
    session.user = { id: "u1" };
  });

  it("returns 401 unauthenticated", async () => {
    session.user = null;
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "p2", rating: 5 }))).status).toBe(401);
  });

  it("returns 400 when rating below 1", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "p2", rating: 0 }))).status).toBe(400);
  });

  it("returns 400 when rating above 5", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "p2", rating: 6 }))).status).toBe(400);
  });

  it("returns 400 when match is not completed", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    state.matchesById[1] = { id: 1, requesterId: "p1", recipientId: "p2", status: "pending" };
    const { POST } = await loadRoute();
    const res = await POST(req({ matchId: 1, revieweeId: "p2", rating: 5 }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when reviewer is not a participant", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    state.matchesById[1] = { id: 1, requesterId: "pX", recipientId: "pY", status: "completed" };
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "pX", rating: 5 }))).status).toBe(403);
  });

  it("returns 409 on duplicate review per (match, reviewer)", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    state.matchesById[1] = { id: 1, requesterId: "p1", recipientId: "p2", status: "completed" };
    state.existingReview = { id: 99, matchId: 1, reviewerId: "p1" };
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "p2", rating: 5 }))).status).toBe(409);
  });

  it("creates review and recalculates average on success", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    state.matchesById[1] = { id: 1, requesterId: "p1", recipientId: "p2", status: "completed" };
    const { POST } = await loadRoute();
    const res = await POST(req({ matchId: 1, revieweeId: "p2", rating: 4, comment: "ok" }));
    expect(res.status).toBe(201);
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0].rating).toBe(4);
    expect(state.recalcCalled).toBe("p2");
  });

  it("returns 400 when reviewee is not a match participant", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    state.matchesById[1] = { id: 1, requesterId: "p1", recipientId: "p2", status: "completed" };
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "pZ", rating: 5 }))).status).toBe(400);
  });

  it("returns 400 on self-review", async () => {
    state.profilesByUserId["u1"] = { id: "p1", fullName: "A" };
    state.matchesById[1] = { id: 1, requesterId: "p1", recipientId: "p2", status: "completed" };
    const { POST } = await loadRoute();
    expect((await POST(req({ matchId: 1, revieweeId: "p1", rating: 5 }))).status).toBe(400);
  });
});
