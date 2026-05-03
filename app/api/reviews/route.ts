import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, matches, profiles } from "@/db/schema";
import { recalculateAverageRating } from "@/lib/tokens";

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const userReviews = await db.query.reviews.findMany({
    where: eq(reviews.revieweeId, profile.id),
    with: {
      reviewer: true,
      match: true,
    },
    orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
  });

  return NextResponse.json(userReviews);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    matchId: number;
    revieweeId: string;
    rating: number;
    comment?: string;
  };

  if (!body.matchId || !body.revieweeId || !body.rating) {
    return NextResponse.json(
      { error: "matchId, revieweeId y rating son requeridos" },
      { status: 400 }
    );
  }

  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { error: "Rating debe ser entre 1 y 5" },
      { status: 400 }
    );
  }

  const reviewerProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (!reviewerProfile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, body.matchId),
  });
  if (!match) {
    return NextResponse.json({ error: "Match no encontrado" }, { status: 404 });
  }

  if (match.status !== "completed") {
    return NextResponse.json(
      { error: "Solo puedes reviewar matches completados" },
      { status: 400 }
    );
  }

  if (
    match.requesterId !== reviewerProfile.id &&
    match.recipientId !== reviewerProfile.id
  ) {
    return NextResponse.json(
      { error: "No participas en este match" },
      { status: 403 }
    );
  }

  if (
    match.requesterId !== body.revieweeId &&
    match.recipientId !== body.revieweeId
  ) {
    return NextResponse.json(
      { error: "El reviewee no participa en este match" },
      { status: 400 }
    );
  }

  if (reviewerProfile.id === body.revieweeId) {
    return NextResponse.json(
      { error: "No puedes reviewarte a ti mismo" },
      { status: 400 }
    );
  }

  const existing = await db.query.reviews.findFirst({
    where: and(
      eq(reviews.matchId, body.matchId),
      eq(reviews.reviewerId, reviewerProfile.id)
    ),
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya dejaste una review para este match" },
      { status: 409 }
    );
  }

  const [review] = await db
    .insert(reviews)
    .values({
      matchId: body.matchId,
      reviewerId: reviewerProfile.id,
      revieweeId: body.revieweeId,
      rating: body.rating,
      comment: body.comment ?? null,
    })
    .returning();

  await recalculateAverageRating(body.revieweeId);

  return NextResponse.json(review, { status: 201 });
}
