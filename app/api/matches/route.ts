import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, profiles, items } from "@/db/schema";
import { canSpendMatchToken, spendMatchToken } from "@/lib/tokens";

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

  const userMatches = await db.query.matches.findMany({
    where: or(
      eq(matches.requesterId, profile.id),
      eq(matches.recipientId, profile.id)
    ),
    with: {
      requester: true,
      recipient: true,
      item: true,
    },
    orderBy: (matches, { desc }) => [desc(matches.createdAt)],
  });

  return NextResponse.json(userMatches);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    recipientId: string;
    itemId?: number;
    matchType: "donante_fletero" | "cliente_cliente";
  };

  if (!body.recipientId || !body.matchType) {
    return NextResponse.json(
      { error: "recipientId y matchType son requeridos" },
      { status: 400 }
    );
  }

  const requesterProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (!requesterProfile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const recipientProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, body.recipientId),
  });
  if (!recipientProfile) {
    return NextResponse.json(
      { error: "Perfil destinatario no encontrado" },
      { status: 404 }
    );
  }

  if (requesterProfile.id === recipientProfile.id) {
    return NextResponse.json(
      { error: "No puedes hacer match contigo mismo" },
      { status: 400 }
    );
  }

  const canSpend = await canSpendMatchToken(requesterProfile.id);
  if (!canSpend) {
    return NextResponse.json(
      { error: "Saldo insuficiente. Compra tokens o espera el proximo mes." },
      { status: 402 }
    );
  }

  if (body.itemId) {
    const item = await db.query.items.findFirst({
      where: eq(items.id, body.itemId),
    });
    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }
  }

  const [match] = await db
    .insert(matches)
    .values({
      requesterId: requesterProfile.id,
      recipientId: body.recipientId,
      itemId: body.itemId ?? null,
      matchType: body.matchType,
      status: "pending",
      tokenCost: 1,
    })
    .returning();

  await spendMatchToken(
    requesterProfile.id,
    match.id,
    `Match #${match.id} con ${recipientProfile.fullName}`
  );

  return NextResponse.json(match, { status: 201 });
}
