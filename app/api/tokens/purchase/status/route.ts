import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tokenPurchases } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const purchaseId = searchParams.get("purchaseId");

  if (!purchaseId) {
    return NextResponse.json(
      { error: "purchaseId requerido" },
      { status: 400 }
    );
  }

  const purchase = await db.query.tokenPurchases.findFirst({
    where: eq(tokenPurchases.id, Number(purchaseId)),
  });

  if (!purchase) {
    return NextResponse.json(
      { error: "Compra no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: purchase.id,
    status: purchase.status,
    tokensPurchased: purchase.tokensPurchased,
    amountCents: purchase.amountCents,
    preferenceId: purchase.preferenceId,
    mpPaymentId: purchase.mpPaymentId,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
  });
}
