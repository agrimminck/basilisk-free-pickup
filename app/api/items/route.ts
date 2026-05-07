import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { items, itemPhotos, profiles } from "@/db/schema";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";

  const session = await auth.api.getSession({ headers: await headers() });
  let profileId: string | undefined;

  if (mine) {
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
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
    profileId = profile.id;
  }

  const allItems = await db.query.items.findMany({
    where: profileId ? eq(items.donanteId, profileId) : undefined,
    with: { photos: true, donante: true },
    orderBy: (items, { desc }) => [desc(items.createdAt)],
  });

  return NextResponse.json(allItems);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const body = (await request.json()) as {
    title: string;
    description: string;
    category: string;
    address: string;
    neighborhood?: string;
    city: string;
    itemType?: "donation" | "sale";
    price?: number;
    photos?: string[];
  };

  if (
    !body.title ||
    !body.description ||
    !body.category ||
    !body.address ||
    !body.city
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  const [item] = await db
    .insert(items)
    .values({
      donanteId: profile.id,
      title: body.title,
      description: body.description,
      category: body.category.toLowerCase() as any,
      itemType: body.itemType ?? "donation",
      price: body.price ?? null,
      status: "available",
      address: body.address,
      neighborhood: body.neighborhood ?? null,
      city: body.city,
    })
    .returning();

  if (body.photos && body.photos.length > 0) {
    await db.insert(itemPhotos).values(
      body.photos.map((url: string, index: number) => ({
        itemId: item.id,
        r2Key: `placeholder-${Date.now()}-${index}`,
        r2Url: url,
        sizeBytes: 0,
      }))
    );
  }

  const itemWithRelations = await db.query.items.findFirst({
    where: eq(items.id, item.id),
    with: { photos: true, donante: true },
  });

  return NextResponse.json(itemWithRelations, { status: 201 });
}
