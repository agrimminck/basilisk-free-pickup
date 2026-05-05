import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, tokenPurchases } from "@/db/schema";
import { TOKEN_PRICE_CLP } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    tokens?: number;
  } | null;
  if (!body?.tokens || body.tokens < 1) {
    return NextResponse.json(
      { error: "Cantidad de tokens invalida" },
      { status: 400 }
    );
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

  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!mpAccessToken) {
    return NextResponse.json(
      { error: "MercadoPago no configurado" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3007";
  const webhookUrl = `${baseUrl}/api/tokens/webhook`;

  const preferencePayload = {
    items: [
      {
        title: `${body.tokens} token${body.tokens > 1 ? "s" : ""} FreePickup`,
        quantity: 1,
        unit_price: body.tokens * TOKEN_PRICE_CLP,
        currency_id: "CLP",
      },
    ],
    external_reference: String(purchase.id),
    back_urls: {
      success: `${baseUrl}/tokens?status=success`,
      failure: `${baseUrl}/tokens?status=failure`,
      pending: `${baseUrl}/tokens?status=pending`,
    },
    auto_return: "approved",
    notification_url: webhookUrl,
  };

  try {
    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferencePayload),
      }
    );

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      throw new Error(`MP error: ${errText}`);
    }

    const mpData = (await mpRes.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point?: string;
    };

    await db
      .update(tokenPurchases)
      .set({
        preferenceId: mpData.id,
        mpInitPoint: mpData.init_point,
      })
      .where(eq(tokenPurchases.id, purchase.id));

    return NextResponse.json({
      initPoint: mpData.init_point,
      purchaseId: purchase.id,
    });
  } catch (err: any) {
    await db
      .update(tokenPurchases)
      .set({ status: "failed" })
      .where(eq(tokenPurchases.id, purchase.id));

    return NextResponse.json(
      { error: err.message || "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
