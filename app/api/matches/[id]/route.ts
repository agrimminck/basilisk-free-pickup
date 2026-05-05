import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, profiles } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      requester: true,
      recipient: true,
      item: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match no encontrado" }, { status: 404 });
  }

  if (match.requesterId !== profile.id && match.recipientId !== profile.id) {
    return NextResponse.json(
      { error: "No participas en este match" },
      { status: 403 }
    );
  }

  return NextResponse.json(match);
}
