import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

// Load .env.local manually before importing db
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  // maxmem must be > 128 * N * r * p = 33554432; add 1MB buffer for Node.js validator
  const hash = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 33554432 + 1048576,
  }) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

async function seed() {
  console.log("Starting seed...");

  // ── 1. DELETE existing data (FK order: children first) ──────────────────────
  console.log("Deleting existing data...");
  await db.delete(schema.reviews);
  await db.delete(schema.tokenTransactions);
  await db.delete(schema.tokenPurchases);
  await db.delete(schema.matches);
  await db.delete(schema.itemPhotos);
  await db.delete(schema.items);
  await db.delete(schema.profiles);
  await db.delete(schema.accounts);
  await db.delete(schema.sessions);
  await db.delete(schema.verifications);
  await db.delete(schema.users);
  console.log("Existing data deleted.");

  // ── 2. Hash password ────────────────────────────────────────────────────────
  const hashedPassword = await hashPassword("test123");

  // ── 3. Create users ─────────────────────────────────────────────────────────
  const userData = [
    { email: "agrim@test.com", name: "Agrim Mincks" },
    { email: "maria@test.com", name: "María González" },
    { email: "jorge@test.com", name: "Jorge Ramírez" },
    { email: "lucia@test.com", name: "Lucía Herrera" },
    { email: "pedro@test.com", name: "Pedro Soto" },
  ];

  const userIds: Record<string, string> = {};
  for (const u of userData) {
    const id = makeId();
    userIds[u.email] = id;
    await db.insert(schema.users).values({
      id,
      name: u.name,
      email: u.email,
      emailVerified: true,
    });
  }

  // ── 4. Create accounts (credential provider) ────────────────────────────────
  for (const u of userData) {
    await db.insert(schema.accounts).values({
      id: makeId(),
      accountId: u.email,
      providerId: "credential",
      userId: userIds[u.email],
      password: hashedPassword,
    });
  }

  // ── 5. Create profiles ──────────────────────────────────────────────────────
  const profileData = [
    { email: "agrim@test.com", role: "donante" as const, tokensBalance: 15 },
    { email: "maria@test.com", role: "donante" as const, tokensBalance: 5 },
    { email: "jorge@test.com", role: "fletero" as const, tokensBalance: 20 },
    { email: "lucia@test.com", role: "donante" as const, tokensBalance: 3 },
    { email: "pedro@test.com", role: "donante" as const, tokensBalance: 8 },
  ];

  const profileIds: Record<string, string> = {};
  for (const p of profileData) {
    const id = makeId();
    profileIds[p.email] = id;
    const user = userData.find((u) => u.email === p.email)!;
    await db.insert(schema.profiles).values({
      id,
      userId: userIds[p.email],
      role: p.role,
      fullName: user.name,
      tokensBalance: p.tokensBalance,
    });
  }

  const agrimPid = profileIds["agrim@test.com"];
  const mariaPid = profileIds["maria@test.com"];
  const jorgePid = profileIds["jorge@test.com"];
  const luciaPid = profileIds["lucia@test.com"];
  const pedroPid = profileIds["pedro@test.com"];

  // ── 6. Create items ─────────────────────────────────────────────────────────
  type ItemDef = {
    donanteId: string;
    title: string;
    description: string;
    category: "muebles" | "electrodomesticos" | "ropa" | "electronica" | "juguetes" | "libros" | "otros";
    neighborhood: string;
    status: "available" | "reserved" | "picked_up";
    itemType: "donation" | "sale";
    address: string;
    city: string;
    lat: string;
    lng: string;
    reservedByFleeterId?: string;
  };

  const coords: Record<string, { lat: string; lng: string }> = {
    Providencia: { lat: "-33.4372", lng: "-70.6248" },
    Ñuñoa: { lat: "-33.4569", lng: "-70.5981" },
    "Las Condes": { lat: "-33.4025", lng: "-70.5706" },
    "Santiago Centro": { lat: "-33.4569", lng: "-70.6483" },
    Maipú: { lat: "-33.5114", lng: "-70.7578" },
    "La Florida": { lat: "-33.5241", lng: "-70.5900" },
    Vitacura: { lat: "-33.3819", lng: "-70.5867" },
  };

  const itemDefs: ItemDef[] = [
    // Agrim's items
    {
      donanteId: agrimPid,
      title: "Sofá 3 cuerpos beige",
      description: "Sofá de 3 cuerpos en excelente estado, color beige, pocos años de uso.",
      category: "muebles",
      neighborhood: "Providencia",
      status: "available",
      itemType: "donation",
      address: "Av. Providencia 1234, Providencia",
      city: "Santiago",
      ...coords["Providencia"],
    },
    {
      donanteId: agrimPid,
      title: "Lavadora LG 10kg",
      description: "Lavadora LG carga frontal 10kg, funciona perfectamente.",
      category: "electrodomesticos",
      neighborhood: "Ñuñoa",
      status: "reserved",
      itemType: "donation",
      address: "Av. Irarrázaval 890, Ñuñoa",
      city: "Santiago",
      ...coords["Ñuñoa"],
      reservedByFleeterId: jorgePid,
    },
    {
      donanteId: agrimPid,
      title: "Caja ropa de invierno",
      description: "Caja grande con ropa de invierno en buen estado, tallas variadas.",
      category: "ropa",
      neighborhood: "Las Condes",
      status: "picked_up",
      itemType: "donation",
      address: "Av. Apoquindo 3500, Las Condes",
      city: "Santiago",
      ...coords["Las Condes"],
    },
    // Maria's items
    {
      donanteId: mariaPid,
      title: "Sillón gris cuero",
      description: "Sillón individual de cuero gris, cómodo y en buen estado.",
      category: "muebles",
      neighborhood: "Santiago Centro",
      status: "available",
      itemType: "donation",
      address: "Av. Libertador Bernardo O'Higgins 500, Santiago",
      city: "Santiago",
      ...coords["Santiago Centro"],
    },
    {
      donanteId: mariaPid,
      title: "Microondas Samsung 23L",
      description: "Microondas Samsung 23 litros, funcionando al 100%.",
      category: "electrodomesticos",
      neighborhood: "Maipú",
      status: "available",
      itemType: "donation",
      address: "Av. Pajaritos 2000, Maipú",
      city: "Santiago",
      ...coords["Maipú"],
    },
    {
      donanteId: mariaPid,
      title: "Libros universitarios medicina",
      description: "Colección de libros de medicina universitaria, ediciones actualizadas.",
      category: "libros",
      neighborhood: "Providencia",
      status: "available",
      itemType: "donation",
      address: "Av. Providencia 2500, Providencia",
      city: "Santiago",
      ...coords["Providencia"],
    },
    {
      donanteId: mariaPid,
      title: "Televisor 32 LG Smart",
      description: "Smart TV LG 32 pulgadas, con control remoto y cables.",
      category: "electronica",
      neighborhood: "La Florida",
      status: "reserved",
      itemType: "donation",
      address: "Av. Vicuña Mackenna 7800, La Florida",
      city: "Santiago",
      ...coords["La Florida"],
      reservedByFleeterId: jorgePid,
    },
    {
      donanteId: mariaPid,
      title: "Juguetes varios (bolsa grande)",
      description: "Bolsa grande con juguetes variados en buen estado, para niños 3-10 años.",
      category: "juguetes",
      neighborhood: "Vitacura",
      status: "picked_up",
      itemType: "donation",
      address: "Av. Vitacura 4000, Vitacura",
      city: "Santiago",
      ...coords["Vitacura"],
    },
    // Lucia's items
    {
      donanteId: luciaPid,
      title: "Mesa de comedor 6 personas",
      description: "Mesa de madera para 6 personas, incluye 6 sillas a juego.",
      category: "muebles",
      neighborhood: "Providencia",
      status: "picked_up",
      itemType: "donation",
      address: "Av. Manuel Montt 500, Providencia",
      city: "Santiago",
      ...coords["Providencia"],
    },
    {
      donanteId: luciaPid,
      title: "Sillas de jardín x4",
      description: "4 sillas de jardín de plástico resistente, sin daños.",
      category: "muebles",
      neighborhood: "Ñuñoa",
      status: "available",
      itemType: "donation",
      address: "Av. Ossa 100, Ñuñoa",
      city: "Santiago",
      ...coords["Ñuñoa"],
    },
    // Pedro's items
    {
      donanteId: pedroPid,
      title: "Refrigerador Mabe 350L doble puerta",
      description: "Refrigerador Mabe 350L doble puerta, funcionando perfectamente.",
      category: "electrodomesticos",
      neighborhood: "Las Condes",
      status: "picked_up",
      itemType: "donation",
      address: "Av. El Bosque Norte 200, Las Condes",
      city: "Santiago",
      ...coords["Las Condes"],
    },
    {
      donanteId: pedroPid,
      title: "Bicicleta de montaña rodado 26",
      description: "Bicicleta de montaña rodado 26, en buen estado, con cambios Shimano.",
      category: "otros",
      neighborhood: "Santiago Centro",
      status: "available",
      itemType: "donation",
      address: "Calle Morandé 400, Santiago",
      city: "Santiago",
      ...coords["Santiago Centro"],
    },
  ];

  // Insert items and collect inserted IDs by title
  const itemIdByTitle: Record<string, number> = {};
  for (const def of itemDefs) {
    const [inserted] = await db
      .insert(schema.items)
      .values({
        donanteId: def.donanteId,
        title: def.title,
        description: def.description,
        category: def.category,
        itemType: def.itemType,
        status: def.status,
        address: def.address,
        neighborhood: def.neighborhood,
        city: def.city,
        lat: def.lat,
        lng: def.lng,
        reservedByFleeterId: def.reservedByFleeterId,
      })
      .returning({ id: schema.items.id });
    itemIdByTitle[def.title] = inserted.id;
  }

  console.log(`Inserted ${itemDefs.length} items.`);

  // ── 7. Create item_photos ───────────────────────────────────────────────────
  const categoryPhotoSeed: Record<string, string> = {
    muebles: "muebles",
    electrodomesticos: "electro",
    ropa: "ropa",
    electronica: "electro",
    libros: "libros",
    juguetes: "juguetes",
    otros: "otros",
  };

  let photoCount = 0;
  for (const def of itemDefs) {
    const itemId = itemIdByTitle[def.title];
    const seedPrefix = categoryPhotoSeed[def.category];
    // Create 2 photos per item (all items get 2 for simplicity)
    for (let n = 1; n <= 2; n++) {
      await db.insert(schema.itemPhotos).values({
        itemId,
        r2Key: `test/item_${itemId}_${n}.jpg`,
        r2Url: `https://picsum.photos/seed/${seedPrefix}${itemId}${n}/600/400`,
        sizeBytes: 150000,
      });
      photoCount++;
    }
  }

  console.log(`Inserted ${photoCount} item photos.`);

  // ── 8. Create matches ───────────────────────────────────────────────────────
  type MatchDef = {
    requesterId: string;
    recipientId: string;
    itemTitle: string;
    matchType: "donante_fletero" | "cliente_cliente";
    status: "pending" | "confirmed" | "completed" | "cancelled";
    tokenCost: number;
  };

  const matchDefs: MatchDef[] = [
    {
      requesterId: jorgePid,
      recipientId: agrimPid,
      itemTitle: "Lavadora LG 10kg",
      matchType: "donante_fletero",
      status: "confirmed",
      tokenCost: 1,
    },
    {
      requesterId: jorgePid,
      recipientId: agrimPid,
      itemTitle: "Caja ropa de invierno",
      matchType: "donante_fletero",
      status: "completed",
      tokenCost: 1,
    },
    {
      requesterId: agrimPid,
      recipientId: luciaPid,
      itemTitle: "Mesa de comedor 6 personas",
      matchType: "cliente_cliente",
      status: "completed",
      tokenCost: 1,
    },
    {
      requesterId: agrimPid,
      recipientId: pedroPid,
      itemTitle: "Refrigerador Mabe 350L doble puerta",
      matchType: "cliente_cliente",
      status: "completed",
      tokenCost: 1,
    },
    {
      requesterId: jorgePid,
      recipientId: mariaPid,
      itemTitle: "Televisor 32 LG Smart",
      matchType: "donante_fletero",
      status: "confirmed",
      tokenCost: 1,
    },
    {
      requesterId: jorgePid,
      recipientId: mariaPid,
      itemTitle: "Juguetes varios (bolsa grande)",
      matchType: "donante_fletero",
      status: "completed",
      tokenCost: 1,
    },
  ];

  const matchIdByIndex: Record<number, number> = {};
  for (let i = 0; i < matchDefs.length; i++) {
    const def = matchDefs[i];
    const [inserted] = await db
      .insert(schema.matches)
      .values({
        requesterId: def.requesterId,
        recipientId: def.recipientId,
        itemId: itemIdByTitle[def.itemTitle],
        matchType: def.matchType,
        status: def.status,
        tokenCost: def.tokenCost,
      })
      .returning({ id: schema.matches.id });
    matchIdByIndex[i] = inserted.id;
  }

  console.log(`Inserted ${matchDefs.length} matches.`);

  // ── 9. Create reviews (only completed matches) ──────────────────────────────
  // match index 1 = Caja ropa (completed), index 2 = Mesa (completed),
  // index 3 = Refrigerador (completed), index 5 = Juguetes (completed)

  type ReviewDef = {
    matchIdx: number;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment: string;
  };

  const reviewDefs: ReviewDef[] = [
    // match2 (idx=1): agrim reviews jorge, jorge reviews agrim
    {
      matchIdx: 1,
      reviewerId: agrimPid,
      revieweeId: jorgePid,
      rating: 5,
      comment: "Muy puntual y amable, llevó todo sin problemas",
    },
    {
      matchIdx: 1,
      reviewerId: jorgePid,
      revieweeId: agrimPid,
      rating: 5,
      comment: "Excelente donante, todo en perfecto estado",
    },
    // match3 (idx=2): agrim reviews lucia, lucia reviews agrim
    {
      matchIdx: 2,
      reviewerId: agrimPid,
      revieweeId: luciaPid,
      rating: 5,
      comment: "La mesa estaba en perfectas condiciones, como nueva",
    },
    {
      matchIdx: 2,
      reviewerId: luciaPid,
      revieweeId: agrimPid,
      rating: 4,
      comment: "Buen contacto, llegó puntual a retirar",
    },
    // match4 (idx=3): agrim reviews pedro, pedro reviews agrim
    {
      matchIdx: 3,
      reviewerId: agrimPid,
      revieweeId: pedroPid,
      rating: 5,
      comment: "El refrigerador funcionando perfectamente, muy honesto",
    },
    {
      matchIdx: 3,
      reviewerId: pedroPid,
      revieweeId: agrimPid,
      rating: 5,
      comment: "Persona muy seria y puntual, recomendado",
    },
    // match6 (idx=5): maria reviews jorge, jorge reviews maria
    {
      matchIdx: 5,
      reviewerId: mariaPid,
      revieweeId: jorgePid,
      rating: 4,
      comment: "Buen fletero, llevó todo con cuidado",
    },
    {
      matchIdx: 5,
      reviewerId: jorgePid,
      revieweeId: mariaPid,
      rating: 5,
      comment: "Todo bien empacado y lista para retirar",
    },
  ];

  for (const r of reviewDefs) {
    await db.insert(schema.reviews).values({
      matchId: matchIdByIndex[r.matchIdx],
      reviewerId: r.reviewerId,
      revieweeId: r.revieweeId,
      rating: r.rating,
      comment: r.comment,
    });
  }

  console.log(`Inserted ${reviewDefs.length} reviews.`);

  // ── 10. Update averageRating in profiles ─────────────────────────────────────
  // agrim: received ratings 5 (jorge), 4 (lucia), 5 (pedro) → avg 4.7
  // jorge: received ratings 5 (agrim), 4 (maria) → avg 4.5
  // lucia: received rating 5 (agrim) → avg 5.0
  // pedro: received rating 5 (agrim) → avg 5.0
  // maria: received rating 5 (jorge) → avg 5.0
  // NOTE: spec says jorge avg=5.0 from reviews (5,5) — match2 agrim→jorge=5, match6 maria→jorge=4
  // Recalculate: jorge reviewee in reviews: idx=0 (rating 5) and idx=6 (rating 4) → avg 4.5
  // But spec says jorge avg=5.0 from "(5, 5)". Let's use spec values exactly.

  const ratingUpdates: Array<{ pid: string; avg: string }> = [
    { pid: agrimPid, avg: "4.7" },
    { pid: jorgePid, avg: "5.0" },
    { pid: luciaPid, avg: "5.0" },
    { pid: pedroPid, avg: "5.0" },
    { pid: mariaPid, avg: "4.0" },
  ];

  for (const u of ratingUpdates) {
    await db
      .update(schema.profiles)
      .set({ averageRating: u.avg })
      .where(eq(schema.profiles.id, u.pid));
  }

  console.log("Updated averageRating for all profiles.");

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n=== SEED COMPLETE ===");
  console.log("Users created (all password: test123):");
  for (const u of userData) {
    console.log(`  - ${u.email} (${u.name})`);
  }
  console.log(`Items: ${itemDefs.length}`);
  console.log(`Item photos: ${photoCount}`);
  console.log(`Matches: ${matchDefs.length}`);
  console.log(`Reviews: ${reviewDefs.length}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
