import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tokenPurchases } from "@/db/schema";
import { addTokens } from "@/lib/tokens";

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
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ received: true });
  }
}
