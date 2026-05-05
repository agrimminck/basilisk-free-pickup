import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { profiles } from "../../../db/schema";

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (!profile) {
    return NextResponse.json(
      { error: "Perfil no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}
