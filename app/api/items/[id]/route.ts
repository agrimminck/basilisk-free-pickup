import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { items } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const item = await db.query.items.findFirst({
    where: eq(items.id, itemId),
    with: {
      photos: true,
      donante: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  return NextResponse.json(item);
}
