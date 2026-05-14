import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tokenPurchases } from "@/db/schema";
import { addTokens } from "@/lib/tokens";
import { verifyMPSignature } from "@/lib/mp-signature";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { type?: string; data?: { id?: string } } | null = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  if (!body?.type || !body?.data?.id) {
    return NextResponse.json({ received: true });
  }

  // MP webhook signature verification (HMAC SHA256).
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 }
      );
    }
    console.warn(
      "[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET not set; skipping signature verification (dev only)"
    );
  } else {
    const valid = verifyMPSignature({
      signatureHeader: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId: String(body.data.id),
      secret: webhookSecret,
    });
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!mpAccessToken) {
    return NextResponse.json({ received: true });
  }

  try {
    if (body.type.startsWith("payment")) {
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${body.data.id}`,
        {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        }
      );

      if (!mpRes.ok) {
        console.error("MP payment fetch failed", await mpRes.text());
        return NextResponse.json({ received: true });
      }

      const payment = (await mpRes.json()) as {
        status?: string;
        external_reference?: string;
      };

      const purchaseId = payment.external_reference
        ? Number(payment.external_reference)
        : null;
      const status = payment.status;

      if (purchaseId && status) {
        const purchase = await db.query.tokenPurchases.findFirst({
          where: eq(tokenPurchases.id, purchaseId),
        });

        if (!purchase) {
          return NextResponse.json({ received: true });
        }

        if (status === "approved") {
          if (purchase.status !== "completed") {
            await db.transaction(async (tx) => {
              await tx
                .update(tokenPurchases)
                .set({
                  status: "completed",
                  mpPaymentId: String(body!.data!.id),
                  updatedAt: new Date(),
                })
                .where(eq(tokenPurchases.id, purchaseId));

              await addTokens(
                purchase.profileId,
                purchase.tokensPurchased,
                `Compra de ${purchase.tokensPurchased} tokens (ID: ${purchaseId})`
              );
            });
          }
        } else if (
          status === "rejected" ||
          status === "cancelled" ||
          status === "refunded"
        ) {
          if (purchase.status === "pending") {
            await db
              .update(tokenPurchases)
              .set({
                status: "failed",
                mpPaymentId: String(body.data.id),
                updatedAt: new Date(),
              })
              .where(eq(tokenPurchases.id, purchaseId));
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ received: true });
  }
}
