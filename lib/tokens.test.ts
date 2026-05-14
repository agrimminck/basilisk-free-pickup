import { describe, it, expect, beforeEach, vi } from "vitest";
import { isFreeMatchesResetNeeded, FREE_MATCHES_PER_MONTH } from "./tokens";

// ---- DB mock infra ----
// tokens.ts imports `db` from `./db`. We mock that module with a controllable
// in-memory store keyed by profile id.

interface FakeProfile {
  id: string;
  tokensBalance: number;
  freeMatchesUsed: number;
  freeMatchesResetAt: Date | null;
}

interface TxRecord {
  profileId: string;
  amount: number;
  transactionType: string;
  description: string;
  matchId?: number | null;
}

const store: { profiles: Map<string, FakeProfile>; txs: TxRecord[] } = {
  profiles: new Map(),
  txs: [],
};

function buildFakeDb() {
  const updater = (table: unknown) => ({
    set: (patch: Partial<FakeProfile>) => ({
      where: (_pred: unknown) => {
        // single-row update: apply patch to all matching by .id from pred capture.
        // Our mock is whitelist: only `profiles` updates happen here.
        if (table === "profiles") {
          for (const p of store.profiles.values()) {
            // crude: apply to all; tests use 1 profile per scenario.
            Object.assign(p, patch);
          }
        }
        return Promise.resolve();
      },
    }),
  });

  const inserter = (table: unknown) => ({
    values: (vals: TxRecord) => {
      if (table === "tokenTransactions") store.txs.push(vals);
      return Promise.resolve();
    },
  });

  return {
    query: {
      profiles: {
        findFirst: async ({ where: _w }: { where: unknown }) => {
          // single profile scenarios → return the only one
          return Array.from(store.profiles.values())[0] ?? null;
        },
      },
    },
    update: (_table: unknown) => updater("profiles"),
    insert: (_table: unknown) => inserter("tokenTransactions"),
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        update: (_t: unknown) => updater("profiles"),
        insert: (_t: unknown) => inserter("tokenTransactions"),
      };
      return cb(tx);
    },
  };
}

vi.mock("./db", () => ({ db: buildFakeDb() }));

// Import after mock so tokens.ts picks up the mocked db.
async function loadTokens() {
  return await import("./tokens");
}

function resetStore(profile: FakeProfile): void {
  store.profiles.clear();
  store.txs.length = 0;
  store.profiles.set(profile.id, { ...profile });
}

describe("isFreeMatchesResetNeeded", () => {
  it("returns true when freeMatchesResetAt is null", () => {
    expect(isFreeMatchesResetNeeded({ freeMatchesResetAt: null })).toBe(true);
  });

  it("returns false within same UTC month", () => {
    const now = new Date();
    const sameMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    expect(isFreeMatchesResetNeeded({ freeMatchesResetAt: sameMonth })).toBe(false);
  });

  it("returns true when reset stamp is from previous month", () => {
    const lastMonth = new Date();
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
    expect(isFreeMatchesResetNeeded({ freeMatchesResetAt: lastMonth })).toBe(true);
  });

  it("returns true when reset stamp is from previous year", () => {
    const lastYear = new Date();
    lastYear.setUTCFullYear(lastYear.getUTCFullYear() - 1);
    expect(isFreeMatchesResetNeeded({ freeMatchesResetAt: lastYear })).toBe(true);
  });
});

describe("spendMatchToken", () => {
  beforeEach(() => {
    store.profiles.clear();
    store.txs.length = 0;
  });

  it("consumes a free match when quota available", async () => {
    const { spendMatchToken } = await loadTokens();
    resetStore({
      id: "p1",
      tokensBalance: 0,
      freeMatchesUsed: 0,
      freeMatchesResetAt: new Date(),
    });
    const res = await spendMatchToken("p1", 1, "test");
    expect(res.usedFree).toBe(true);
    expect(store.profiles.get("p1")!.freeMatchesUsed).toBe(1);
    expect(store.txs.at(-1)!.transactionType).toBe("free_match");
  });

  it("falls back to token balance when free quota exhausted", async () => {
    const { spendMatchToken } = await loadTokens();
    resetStore({
      id: "p1",
      tokensBalance: 3,
      freeMatchesUsed: FREE_MATCHES_PER_MONTH,
      freeMatchesResetAt: new Date(),
    });
    const res = await spendMatchToken("p1", 5, "paid");
    expect(res.usedFree).toBe(false);
    expect(store.profiles.get("p1")!.tokensBalance).toBe(2);
    expect(store.txs.at(-1)!.transactionType).toBe("match_spend");
    expect(store.txs.at(-1)!.amount).toBe(-1);
  });

  it("rejects when out of free quota AND zero balance", async () => {
    const { spendMatchToken } = await loadTokens();
    resetStore({
      id: "p1",
      tokensBalance: 0,
      freeMatchesUsed: FREE_MATCHES_PER_MONTH,
      freeMatchesResetAt: new Date(),
    });
    await expect(spendMatchToken("p1", 9, "no funds")).rejects.toThrow(
      /insuficiente/i
    );
  });

  it("auto-resets free quota when month rolled over before spending", async () => {
    const { spendMatchToken } = await loadTokens();
    const lastMonth = new Date();
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 2);
    resetStore({
      id: "p1",
      tokensBalance: 0,
      freeMatchesUsed: FREE_MATCHES_PER_MONTH,
      freeMatchesResetAt: lastMonth,
    });
    const res = await spendMatchToken("p1", 1, "rolled over");
    expect(res.usedFree).toBe(true);
    // After reset, used should be 1 (was reset to 0 then +1)
    expect(store.profiles.get("p1")!.freeMatchesUsed).toBe(1);
  });
});

describe("canSpendMatchToken", () => {
  beforeEach(() => {
    store.profiles.clear();
  });

  it("returns true with free quota remaining", async () => {
    const { canSpendMatchToken } = await loadTokens();
    resetStore({
      id: "p1",
      tokensBalance: 0,
      freeMatchesUsed: 0,
      freeMatchesResetAt: new Date(),
    });
    expect(await canSpendMatchToken("p1")).toBe(true);
  });

  it("returns true with paid tokens but no free quota", async () => {
    const { canSpendMatchToken } = await loadTokens();
    resetStore({
      id: "p1",
      tokensBalance: 1,
      freeMatchesUsed: FREE_MATCHES_PER_MONTH,
      freeMatchesResetAt: new Date(),
    });
    expect(await canSpendMatchToken("p1")).toBe(true);
  });

  it("returns false with neither", async () => {
    const { canSpendMatchToken } = await loadTokens();
    resetStore({
      id: "p1",
      tokensBalance: 0,
      freeMatchesUsed: FREE_MATCHES_PER_MONTH,
      freeMatchesResetAt: new Date(),
    });
    expect(await canSpendMatchToken("p1")).toBe(false);
  });
});
