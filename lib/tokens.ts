import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { profiles, tokenTransactions, reviews } from "../db/schema";

export const FREE_MATCHES_PER_MONTH = 4;
export const TOKEN_PRICE_CLP = 1000;

export function isFreeMatchesResetNeeded(profile: {
  freeMatchesResetAt: Date | null;
}): boolean {
  if (!profile.freeMatchesResetAt) return true;
  const now = new Date();
  const resetAt = new Date(profile.freeMatchesResetAt);
  return (
    now.getUTCFullYear() > resetAt.getUTCFullYear() ||
    now.getUTCMonth() > resetAt.getUTCMonth()
  );
}

export async function resetFreeMatchesIfNeeded(profileId: string): Promise<void> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
  });
  if (!profile) return;
  if (isFreeMatchesResetNeeded(profile)) {
    await db
      .update(profiles)
      .set({
        freeMatchesUsed: 0,
        freeMatchesResetAt: new Date(),
      })
      .where(eq(profiles.id, profileId));
  }
}

export async function canSpendMatchToken(profileId: string): Promise<boolean> {
  await resetFreeMatchesIfNeeded(profileId);
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
  });
  if (!profile) return false;
  return profile.tokensBalance > 0 || profile.freeMatchesUsed < FREE_MATCHES_PER_MONTH;
}

export async function spendMatchToken(
  profileId: string,
  matchId: number,
  description: string
): Promise<{ usedFree: boolean }> {
  await resetFreeMatchesIfNeeded(profileId);
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const hasFreeMatch = profile.freeMatchesUsed < FREE_MATCHES_PER_MONTH;

  if (hasFreeMatch) {
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({ freeMatchesUsed: profile.freeMatchesUsed + 1 })
        .where(eq(profiles.id, profileId));
      await tx.insert(tokenTransactions).values({
        profileId,
        amount: 0,
        transactionType: "free_match",
        description,
        matchId,
      });
    });
    return { usedFree: true };
  }

  if (profile.tokensBalance < 1) {
    throw new Error("Saldo de tokens insuficiente");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ tokensBalance: profile.tokensBalance - 1 })
      .where(eq(profiles.id, profileId));
    await tx.insert(tokenTransactions).values({
      profileId,
      amount: -1,
      transactionType: "match_spend",
      description,
      matchId,
    });
  });
  return { usedFree: false };
}

export async function addTokens(
  profileId: string,
  amount: number,
  description: string
): Promise<void> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
  });
  if (!profile) throw new Error("Perfil no encontrado");

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ tokensBalance: profile.tokensBalance + amount })
      .where(eq(profiles.id, profileId));
    await tx.insert(tokenTransactions).values({
      profileId,
      amount,
      transactionType: "purchase",
      description,
    });
  });
}

export async function recalculateAverageRating(profileId: string): Promise<void> {
  const result = await db
    .select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` })
    .from(reviews)
    .where(eq(reviews.revieweeId, profileId));

  const avg = result[0]?.avg ?? 0;
  await db
    .update(profiles)
    .set({ averageRating: String(avg.toFixed(1)) })
    .where(eq(profiles.id, profileId));
}
