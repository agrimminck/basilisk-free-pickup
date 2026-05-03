import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, tokenPurchases } from "@/db/schema";
import { addTokens, TOKEN_PRICE_CLP } from "@/lib/tokens";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as { tokens: number };
  if (!body.tokens || body.tokens < 1) {
    return NextResponse.json(
      { error: "Cantidad de tokens invalida" },
      { status: 400 }
    );
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const amountCents = body.tokens * TOKEN_PRICE_CLP * 100;

  const [purchase] = await db
    .insert(tokenPurchases)
    .values({
      profileId: profile.id,
      amountCents,
      tokensPurchased: body.tokens,
      status: "pending",
    })
    .returning();

  // TODO: integrar pasarela de pagos (MercadoPago/Stripe)
  // Por ahora completamos directamente para pruebas
  await db
    .update(tokenPurchases)
    .set({ status: "completed" })
    .where(eq(tokenPurchases.id, purchase.id));

  await addTokens(
    profile.id,
    body.tokens,
    `Compra de ${body.tokens} tokens (ID: ${purchase.id})`
  );

  return NextResponse.json({
    purchaseId: purchase.id,
    tokens: body.tokens,
    amountCents,
    status: "completed",
  });
}
