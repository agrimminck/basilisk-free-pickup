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

  // ── 3. Create users — 5 original + 8 new ───────────────────────────────────
  const userData = [
    { email: "agrim@test.com",      name: "Agrim Mincks" },
    { email: "maria@test.com",      name: "María González" },
    { email: "jorge@test.com",      name: "Jorge Ramírez" },
    { email: "lucia@test.com",      name: "Lucía Herrera" },
    { email: "pedro@test.com",      name: "Pedro Soto" },
    { email: "carlos@test.com",     name: "Carlos Muñoz" },
    { email: "sofia@test.com",      name: "Sofía Vega" },
    { email: "diego@test.com",      name: "Diego Paredes" },
    { email: "valentina@test.com",  name: "Valentina Castro" },
    { email: "rodrigo@test.com",    name: "Rodrigo Fuentes" },
    { email: "camila@test.com",     name: "Camila Torres" },
    { email: "andres@test.com",     name: "Andrés Morales" },
    { email: "javiera@test.com",    name: "Javiera Rojas" },
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
    { email: "agrim@test.com",     role: "donante" as const, tokensBalance: 15 },
    { email: "maria@test.com",     role: "donante" as const, tokensBalance: 5 },
    { email: "jorge@test.com",     role: "fletero" as const, tokensBalance: 20 },
    { email: "lucia@test.com",     role: "donante" as const, tokensBalance: 3 },
    { email: "pedro@test.com",     role: "donante" as const, tokensBalance: 8 },
    { email: "carlos@test.com",    role: "donante" as const, tokensBalance: 6 },
    { email: "sofia@test.com",     role: "donante" as const, tokensBalance: 4 },
    { email: "diego@test.com",     role: "donante" as const, tokensBalance: 7 },
    { email: "valentina@test.com", role: "donante" as const, tokensBalance: 2 },
    { email: "rodrigo@test.com",   role: "donante" as const, tokensBalance: 9 },
    { email: "camila@test.com",    role: "donante" as const, tokensBalance: 3 },
    { email: "andres@test.com",    role: "donante" as const, tokensBalance: 5 },
    { email: "javiera@test.com",   role: "donante" as const, tokensBalance: 1 },
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

  const agrimPid     = profileIds["agrim@test.com"];
  const mariaPid     = profileIds["maria@test.com"];
  const jorgePid     = profileIds["jorge@test.com"];
  const luciaPid     = profileIds["lucia@test.com"];
  const pedroPid     = profileIds["pedro@test.com"];
  const carlosPid    = profileIds["carlos@test.com"];
  const sofiaPid     = profileIds["sofia@test.com"];
  const diegoPid     = profileIds["diego@test.com"];
  const valentinaPid = profileIds["valentina@test.com"];
  const rodrigoPid   = profileIds["rodrigo@test.com"];
  const camilaPid    = profileIds["camila@test.com"];
  const andresPid    = profileIds["andres@test.com"];
  const javieraPid   = profileIds["javiera@test.com"];

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

  // 30 Santiago Centro coordinate groups
  const coords: Record<string, { lat: string; lng: string }> = {
    "Plaza de Armas":            { lat: "-33.438", lng: "-70.650" },
    "Barrio Lastarria":          { lat: "-33.438", lng: "-70.640" },
    "Barrio Italia":             { lat: "-33.453", lng: "-70.630" },
    "Barrio República":          { lat: "-33.458", lng: "-70.657" },
    "Barrio Yungay":             { lat: "-33.448", lng: "-70.662" },
    "Concha y Toro":             { lat: "-33.454", lng: "-70.656" },
    "Barrio Brasil":             { lat: "-33.445", lng: "-70.668" },
    "Barrio Dieciocho":          { lat: "-33.460", lng: "-70.652" },
    "Barrio Matta Norte":        { lat: "-33.456", lng: "-70.642" },
    "Av. Matta":                 { lat: "-33.462", lng: "-70.638" },
    "Barrio Balmaceda":          { lat: "-33.440", lng: "-70.658" },
    "Barrio Santa Isabel":       { lat: "-33.456", lng: "-70.630" },
    "Barrio Lira":               { lat: "-33.453", lng: "-70.645" },
    "Av. España":                { lat: "-33.443", lng: "-70.663" },
    "Barrio Paris-Londres":      { lat: "-33.451", lng: "-70.649" },
    "Barrio Almagro":            { lat: "-33.462", lng: "-70.652" },
    "Barrio Vivaceta":           { lat: "-33.442", lng: "-70.673" },
    "Barrio Recoleta":           { lat: "-33.432", lng: "-70.645" },
    "Barrio Patronato":          { lat: "-33.430", lng: "-70.645" },
    "Barrio Bellas Artes":       { lat: "-33.436", lng: "-70.644" },
    "Plaza Baquedano":           { lat: "-33.438", lng: "-70.633" },
    "Barrio Pio Nono":           { lat: "-33.430", lng: "-70.636" },
    "Barrio Loreto":             { lat: "-33.448", lng: "-70.635" },
    "Av. Vicuña Mackenna":       { lat: "-33.462", lng: "-70.626" },
    "Barrio San Eugenio":        { lat: "-33.466", lng: "-70.635" },
    "Barrio Club Hípico":        { lat: "-33.462", lng: "-70.644" },
    "Barrio Chuchunco":          { lat: "-33.462", lng: "-70.677" },
    "Barrio Manuel Rodríguez":   { lat: "-33.443", lng: "-70.672" },
    "Av. General Velásquez":     { lat: "-33.450", lng: "-70.678" },
    "Barrio Quinta Normal":      { lat: "-33.445", lng: "-70.677" },
  };

  // 65 items total. Items needed for matches use non-available statuses (6 items).
  // All remaining 59 items are available.
  const itemDefs: ItemDef[] = [
    // ── Plaza de Armas: 4 items ──────────────────────────────────────────────
    {
      donanteId: agrimPid,
      title: "Sofá 3 cuerpos beige",
      description: "Sofá de 3 cuerpos en excelente estado, color beige, pocos años de uso.",
      category: "muebles",
      neighborhood: "Plaza de Armas",
      status: "available",
      itemType: "donation",
      address: "Calle Catedral 1100, Santiago Centro",
      city: "Santiago",
      ...coords["Plaza de Armas"],
    },
    {
      donanteId: mariaPid,
      title: "Sillón gris cuero",
      description: "Sillón individual de cuero gris, cómodo y en buen estado.",
      category: "muebles",
      neighborhood: "Plaza de Armas",
      status: "available",
      itemType: "donation",
      address: "Plaza de Armas 100, Santiago Centro",
      city: "Santiago",
      ...coords["Plaza de Armas"],
    },
    {
      donanteId: pedroPid,
      title: "Bicicleta de montaña rodado 26",
      description: "Bicicleta de montaña rodado 26, en buen estado, con cambios Shimano.",
      category: "otros",
      neighborhood: "Plaza de Armas",
      status: "available",
      itemType: "donation",
      address: "Calle Compañía de Jesús 800, Santiago Centro",
      city: "Santiago",
      ...coords["Plaza de Armas"],
    },
    {
      donanteId: carlosPid,
      title: "Escritorio madera con cajones",
      description: "Escritorio de madera sólida con 3 cajones, ideal para estudio u oficina.",
      category: "muebles",
      neighborhood: "Plaza de Armas",
      status: "available",
      itemType: "donation",
      address: "Calle Moneda 960, Santiago Centro",
      city: "Santiago",
      ...coords["Plaza de Armas"],
    },

    // ── Barrio Lastarria: 3 items ────────────────────────────────────────────
    {
      donanteId: mariaPid,
      title: "Libros universitarios medicina",
      description: "Colección de libros de medicina universitaria, ediciones actualizadas.",
      category: "libros",
      neighborhood: "Barrio Lastarria",
      status: "available",
      itemType: "donation",
      address: "Av. Lastarria 120, Barrio Lastarria",
      city: "Santiago",
      ...coords["Barrio Lastarria"],
    },
    {
      donanteId: mariaPid,
      title: "Microondas Samsung 23L",
      description: "Microondas Samsung 23 litros, funcionando al 100%.",
      category: "electrodomesticos",
      neighborhood: "Barrio Lastarria",
      status: "available",
      itemType: "donation",
      address: "Calle Rosal 450, Barrio Lastarria",
      city: "Santiago",
      ...coords["Barrio Lastarria"],
    },
    {
      donanteId: sofiaPid,
      title: "Monitor 22 pulgadas Full HD",
      description: "Monitor 22 pulgadas Full HD, sin píxeles muertos, con cable HDMI.",
      category: "electronica",
      neighborhood: "Barrio Lastarria",
      status: "available",
      itemType: "donation",
      address: "Calle Villavicencio 361, Barrio Lastarria",
      city: "Santiago",
      ...coords["Barrio Lastarria"],
    },

    // ── Barrio Italia: 3 items ───────────────────────────────────────────────
    {
      donanteId: agrimPid,
      title: "Caja ropa de invierno",
      description: "Caja grande con ropa de invierno en buen estado, tallas variadas.",
      category: "ropa",
      neighborhood: "Barrio Italia",
      status: "picked_up",   // used in match idx=1
      itemType: "donation",
      address: "Av. Italia 1200, Barrio Italia",
      city: "Santiago",
      ...coords["Barrio Italia"],
    },
    {
      donanteId: luciaPid,
      title: "Sillas de jardín x4",
      description: "4 sillas de jardín de plástico resistente, sin daños.",
      category: "muebles",
      neighborhood: "Barrio Italia",
      status: "available",
      itemType: "donation",
      address: "Calle Condell 1500, Barrio Italia",
      city: "Santiago",
      ...coords["Barrio Italia"],
    },
    {
      donanteId: diegoPid,
      title: "Cafetera italiana moka 6 tazas",
      description: "Cafetera moka italiana de aluminio para 6 tazas, en perfecto estado.",
      category: "electrodomesticos",
      neighborhood: "Barrio Italia",
      status: "available",
      itemType: "donation",
      address: "Calle Condell 1800, Barrio Italia",
      city: "Santiago",
      ...coords["Barrio Italia"],
    },

    // ── Barrio República: 2 items ────────────────────────────────────────────
    {
      donanteId: agrimPid,
      title: "Lavadora LG 10kg",
      description: "Lavadora LG carga frontal 10kg, funciona perfectamente.",
      category: "electrodomesticos",
      neighborhood: "Barrio República",
      status: "reserved",   // used in match idx=0
      itemType: "donation",
      address: "Av. República 450, Barrio República",
      city: "Santiago",
      ...coords["Barrio República"],
      reservedByFleeterId: jorgePid,
    },
    {
      donanteId: luciaPid,
      title: "Mesa de comedor 6 personas",
      description: "Mesa de madera para 6 personas, incluye 6 sillas a juego.",
      category: "muebles",
      neighborhood: "Barrio República",
      status: "picked_up",  // used in match idx=2
      itemType: "donation",
      address: "Calle Serrano 150, Barrio República",
      city: "Santiago",
      ...coords["Barrio República"],
    },

    // ── Barrio Yungay: 3 items ───────────────────────────────────────────────
    {
      donanteId: mariaPid,
      title: "Televisor 32 LG Smart",
      description: "Smart TV LG 32 pulgadas, con control remoto y cables.",
      category: "electronica",
      neighborhood: "Barrio Yungay",
      status: "reserved",   // used in match idx=4
      itemType: "donation",
      address: "Av. Cumming 100, Barrio Yungay",
      city: "Santiago",
      ...coords["Barrio Yungay"],
      reservedByFleeterId: jorgePid,
    },
    {
      donanteId: pedroPid,
      title: "Refrigerador Mabe 350L doble puerta",
      description: "Refrigerador Mabe 350L doble puerta, funcionando perfectamente.",
      category: "electrodomesticos",
      neighborhood: "Barrio Yungay",
      status: "picked_up",  // used in match idx=3
      itemType: "donation",
      address: "Calle Libertad 250, Barrio Yungay",
      city: "Santiago",
      ...coords["Barrio Yungay"],
    },
    {
      donanteId: valentinaPid,
      title: "Ropa de bebé talla 0-12 meses",
      description: "Bolsa con ropa de bebé talla 0 a 12 meses, en buen estado, sin manchas.",
      category: "ropa",
      neighborhood: "Barrio Yungay",
      status: "available",
      itemType: "donation",
      address: "Calle Maipú 550, Barrio Yungay",
      city: "Santiago",
      ...coords["Barrio Yungay"],
    },

    // ── Concha y Toro: 1 item ────────────────────────────────────────────────
    {
      donanteId: mariaPid,
      title: "Juguetes varios (bolsa grande)",
      description: "Bolsa grande con juguetes variados en buen estado, para niños 3-10 años.",
      category: "juguetes",
      neighborhood: "Concha y Toro",
      status: "picked_up",  // used in match idx=5
      itemType: "donation",
      address: "Calle Dieciocho 120, Concha y Toro",
      city: "Santiago",
      ...coords["Concha y Toro"],
    },

    // ── Barrio Brasil: 3 items ───────────────────────────────────────────────
    {
      donanteId: rodrigoPid,
      title: "Librero de madera 5 repisas",
      description: "Librero de madera pino, 5 repisas, fácil de desarmar y transportar.",
      category: "muebles",
      neighborhood: "Barrio Brasil",
      status: "available",
      itemType: "donation",
      address: "Av. Brasil 340, Barrio Brasil",
      city: "Santiago",
      ...coords["Barrio Brasil"],
    },
    {
      donanteId: camilaPid,
      title: "Aspiradora Electrolux sin bolsa",
      description: "Aspiradora Electrolux sin bolsa, con todos los accesorios, funciona bien.",
      category: "electrodomesticos",
      neighborhood: "Barrio Brasil",
      status: "available",
      itemType: "donation",
      address: "Calle Erasmo Escala 1900, Barrio Brasil",
      city: "Santiago",
      ...coords["Barrio Brasil"],
    },
    {
      donanteId: andresPid,
      title: "Juego de mesa Monopoly",
      description: "Monopoly completo con todas las piezas, en caja original.",
      category: "juguetes",
      neighborhood: "Barrio Brasil",
      status: "available",
      itemType: "donation",
      address: "Calle Agustinas 2200, Barrio Brasil",
      city: "Santiago",
      ...coords["Barrio Brasil"],
    },

    // ── Barrio Dieciocho: 2 items ────────────────────────────────────────────
    {
      donanteId: javieraPid,
      title: "Plancha a vapor Oster",
      description: "Plancha a vapor Oster en buen estado, con cable en perfecto estado.",
      category: "electrodomesticos",
      neighborhood: "Barrio Dieciocho",
      status: "available",
      itemType: "donation",
      address: "Calle Dieciocho 480, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Dieciocho"],
    },
    {
      donanteId: carlosPid,
      title: "Cómoda 4 cajones blanca",
      description: "Cómoda de melamina blanca con 4 cajones, en buen estado.",
      category: "muebles",
      neighborhood: "Barrio Dieciocho",
      status: "available",
      itemType: "donation",
      address: "Av. Dieciocho 390, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Dieciocho"],
    },

    // ── Barrio Matta Norte: 2 items ──────────────────────────────────────────
    {
      donanteId: sofiaPid,
      title: "Teclado USB y mouse inalámbrico",
      description: "Set teclado USB y mouse inalámbrico, ambos funcionando correctamente.",
      category: "electronica",
      neighborhood: "Barrio Matta Norte",
      status: "available",
      itemType: "donation",
      address: "Av. Matta 1100, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Matta Norte"],
    },
    {
      donanteId: diegoPid,
      title: "Novelas policiales (lote 10)",
      description: "Lote de 10 novelas policiales en buen estado, autores varios.",
      category: "libros",
      neighborhood: "Barrio Matta Norte",
      status: "available",
      itemType: "donation",
      address: "Calle Santa Rosa 1600, Barrio Matta Norte",
      city: "Santiago",
      ...coords["Barrio Matta Norte"],
    },

    // ── Av. Matta: 2 items ───────────────────────────────────────────────────
    {
      donanteId: valentinaPid,
      title: "Ropa deportiva hombre talla M",
      description: "Set de ropa deportiva para hombre talla M, en buen estado.",
      category: "ropa",
      neighborhood: "Av. Matta",
      status: "available",
      itemType: "donation",
      address: "Av. Matta 1800, Santiago Centro",
      city: "Santiago",
      ...coords["Av. Matta"],
    },
    {
      donanteId: rodrigoPid,
      title: "Silla de escritorio con ruedas",
      description: "Silla de escritorio ergonómica con ruedas, regulable en altura.",
      category: "muebles",
      neighborhood: "Av. Matta",
      status: "available",
      itemType: "donation",
      address: "Av. Matta 2100, Santiago Centro",
      city: "Santiago",
      ...coords["Av. Matta"],
    },

    // ── Barrio Balmaceda: 2 items ────────────────────────────────────────────
    {
      donanteId: camilaPid,
      title: "Herramientas de jardín (set)",
      description: "Set de herramientas de jardín: pala, rastrillo, azada y tijeras.",
      category: "otros",
      neighborhood: "Barrio Balmaceda",
      status: "available",
      itemType: "donation",
      address: "Calle Balmaceda 1400, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Balmaceda"],
    },
    {
      donanteId: andresPid,
      title: "Velador con lámpara",
      description: "Velador de madera con lámpara de escritorio incluida, buen estado.",
      category: "muebles",
      neighborhood: "Barrio Balmaceda",
      status: "available",
      itemType: "donation",
      address: "Calle Marín 320, Barrio Balmaceda",
      city: "Santiago",
      ...coords["Barrio Balmaceda"],
    },

    // ── Barrio Santa Isabel: 2 items ─────────────────────────────────────────
    {
      donanteId: javieraPid,
      title: "Hervidor eléctrico Oster 1.7L",
      description: "Hervidor eléctrico Oster de 1.7 litros, sin calcificación, funciona bien.",
      category: "electrodomesticos",
      neighborhood: "Barrio Santa Isabel",
      status: "available",
      itemType: "donation",
      address: "Av. Santa Isabel 550, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Santa Isabel"],
    },
    {
      donanteId: carlosPid,
      title: "Enciclopedia Larousse (set 12 tomos)",
      description: "Enciclopedia Larousse completa, 12 tomos, en buen estado.",
      category: "libros",
      neighborhood: "Barrio Santa Isabel",
      status: "available",
      itemType: "donation",
      address: "Calle Santa Isabel 700, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Santa Isabel"],
    },

    // ── Barrio Lira: 2 items ─────────────────────────────────────────────────
    {
      donanteId: sofiaPid,
      title: "Poltrona de lectura verde",
      description: "Poltrona tapizada en tela verde, muy cómoda, sin desgaste.",
      category: "muebles",
      neighborhood: "Barrio Lira",
      status: "available",
      itemType: "donation",
      address: "Calle Lira 450, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Lira"],
    },
    {
      donanteId: diegoPid,
      title: "Peluches varios (bolsa)",
      description: "Bolsa con peluches variados en buen estado, bien lavados.",
      category: "juguetes",
      neighborhood: "Barrio Lira",
      status: "available",
      itemType: "donation",
      address: "Calle Lira 600, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Lira"],
    },

    // ── Av. España: 2 items ──────────────────────────────────────────────────
    {
      donanteId: valentinaPid,
      title: "Macetas de cerámica x3",
      description: "Tres macetas de cerámica de distintos tamaños, sin plantas.",
      category: "otros",
      neighborhood: "Av. España",
      status: "available",
      itemType: "donation",
      address: "Av. España 1200, Santiago Centro",
      city: "Santiago",
      ...coords["Av. España"],
    },
    {
      donanteId: rodrigoPid,
      title: "Triciclo infantil rojo",
      description: "Triciclo infantil color rojo para niños 2-4 años, en buen estado.",
      category: "juguetes",
      neighborhood: "Av. España",
      status: "available",
      itemType: "donation",
      address: "Av. España 1450, Santiago Centro",
      city: "Santiago",
      ...coords["Av. España"],
    },

    // ── Barrio Paris-Londres: 2 items ────────────────────────────────────────
    {
      donanteId: camilaPid,
      title: "Cuadros decorativos (set 3)",
      description: "Set de 3 cuadros decorativos modernos, listos para colgar.",
      category: "otros",
      neighborhood: "Barrio Paris-Londres",
      status: "available",
      itemType: "donation",
      address: "Calle París 120, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Paris-Londres"],
    },
    {
      donanteId: andresPid,
      title: "Router WiFi Tp-Link",
      description: "Router TP-Link doble banda, funciona bien, con cable de red y alimentador.",
      category: "electronica",
      neighborhood: "Barrio Paris-Londres",
      status: "available",
      itemType: "donation",
      address: "Calle Londres 65, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Paris-Londres"],
    },

    // ── Barrio Almagro: 2 items ──────────────────────────────────────────────
    {
      donanteId: javieraPid,
      title: "Ropa escolar uniforme talla 8-10",
      description: "Uniformes escolares talla 8-10 años, lavados y en buen estado.",
      category: "ropa",
      neighborhood: "Barrio Almagro",
      status: "available",
      itemType: "donation",
      address: "Av. Almagro 1800, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Almagro"],
    },
    {
      donanteId: carlosPid,
      title: "Tostadora 2 ranuras Imaco",
      description: "Tostadora 2 ranuras marca Imaco, con selector de intensidad, funciona bien.",
      category: "electrodomesticos",
      neighborhood: "Barrio Almagro",
      status: "available",
      itemType: "donation",
      address: "Calle Almagro 2100, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Almagro"],
    },

    // ── Barrio Vivaceta: 2 items ─────────────────────────────────────────────
    {
      donanteId: sofiaPid,
      title: "Maleta de viaje mediana",
      description: "Maleta de viaje mediana con ruedas, negra, sin daños en el cierre.",
      category: "otros",
      neighborhood: "Barrio Vivaceta",
      status: "available",
      itemType: "donation",
      address: "Calle Vivaceta 500, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Vivaceta"],
    },
    {
      donanteId: diegoPid,
      title: "Espejo de pie rectangular",
      description: "Espejo de pie rectangular con marco de madera oscura, 170x50 cm.",
      category: "otros",
      neighborhood: "Barrio Vivaceta",
      status: "available",
      itemType: "donation",
      address: "Calle Vivaceta 780, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Vivaceta"],
    },

    // ── Barrio Recoleta: 2 items ─────────────────────────────────────────────
    {
      donanteId: valentinaPid,
      title: "Cómics manga (lote 15)",
      description: "Lote de 15 cómics manga en buen estado, varios títulos.",
      category: "libros",
      neighborhood: "Barrio Recoleta",
      status: "available",
      itemType: "donation",
      address: "Av. Recoleta 620, Barrio Recoleta",
      city: "Santiago",
      ...coords["Barrio Recoleta"],
    },
    {
      donanteId: rodrigoPid,
      title: "Parlantes Bluetooth pequeños",
      description: "Par de parlantes Bluetooth compactos, carga USB, sonido claro.",
      category: "electronica",
      neighborhood: "Barrio Recoleta",
      status: "available",
      itemType: "donation",
      address: "Calle Dominica 400, Barrio Recoleta",
      city: "Santiago",
      ...coords["Barrio Recoleta"],
    },

    // ── Barrio Patronato: 3 items ────────────────────────────────────────────
    {
      donanteId: camilaPid,
      title: "Ropero 3 cuerpos melamina",
      description: "Ropero de melamina color wengué, 3 cuerpos con espejo central.",
      category: "muebles",
      neighborhood: "Barrio Patronato",
      status: "available",
      itemType: "donation",
      address: "Calle Patronato 200, Barrio Patronato",
      city: "Santiago",
      ...coords["Barrio Patronato"],
    },
    {
      donanteId: andresPid,
      title: "Bicicleta infantil rodado 20",
      description: "Bicicleta infantil rodado 20, color azul, con rueditas de apoyo.",
      category: "juguetes",
      neighborhood: "Barrio Patronato",
      status: "available",
      itemType: "donation",
      address: "Calle Loreto 150, Barrio Patronato",
      city: "Santiago",
      ...coords["Barrio Patronato"],
    },
    {
      donanteId: javieraPid,
      title: "Artículos de cocina varios",
      description: "Lote de utensilios de cocina: ollas, sartenes y cubiertos en buen estado.",
      category: "otros",
      neighborhood: "Barrio Patronato",
      status: "available",
      itemType: "donation",
      address: "Av. Bellavista 210, Barrio Patronato",
      city: "Santiago",
      ...coords["Barrio Patronato"],
    },

    // ── Barrio Bellas Artes: 3 items ─────────────────────────────────────────
    {
      donanteId: carlosPid,
      title: "Tablet Samsung A7 lite",
      description: "Tablet Samsung Galaxy A7 Lite, pantalla sin grietas, funciona bien.",
      category: "electronica",
      neighborhood: "Barrio Bellas Artes",
      status: "available",
      itemType: "donation",
      address: "Av. Bellas Artes 80, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Bellas Artes"],
    },
    {
      donanteId: sofiaPid,
      title: "Libros de texto escolar (básica)",
      description: "Libros de texto educación básica, varios grados, en buen estado.",
      category: "libros",
      neighborhood: "Barrio Bellas Artes",
      status: "available",
      itemType: "donation",
      address: "Calle Lastarria 30, Barrio Bellas Artes",
      city: "Santiago",
      ...coords["Barrio Bellas Artes"],
    },
    {
      donanteId: diegoPid,
      title: "Estante metálico 5 niveles",
      description: "Estante metálico de 5 niveles, desmontable, muy resistente.",
      category: "muebles",
      neighborhood: "Barrio Bellas Artes",
      status: "available",
      itemType: "donation",
      address: "Calle Merced 280, Barrio Bellas Artes",
      city: "Santiago",
      ...coords["Barrio Bellas Artes"],
    },

    // ── Plaza Baquedano: 2 items ─────────────────────────────────────────────
    {
      donanteId: valentinaPid,
      title: "Ropa de verano mujer talla S",
      description: "Bolsa con ropa de verano para mujer talla S, en buen estado.",
      category: "ropa",
      neighborhood: "Plaza Baquedano",
      status: "available",
      itemType: "donation",
      address: "Av. Providencia 1, Plaza Baquedano",
      city: "Santiago",
      ...coords["Plaza Baquedano"],
    },
    {
      donanteId: rodrigoPid,
      title: "Licuadora Oster 3 velocidades",
      description: "Licuadora Oster de 3 velocidades con jarra de vidrio, funciona bien.",
      category: "electrodomesticos",
      neighborhood: "Plaza Baquedano",
      status: "available",
      itemType: "donation",
      address: "Av. Irarrázaval 5, Plaza Baquedano",
      city: "Santiago",
      ...coords["Plaza Baquedano"],
    },

    // ── Barrio Pio Nono: 3 items ─────────────────────────────────────────────
    {
      donanteId: camilaPid,
      title: "Cables HDMI y USB varios",
      description: "Lote de cables HDMI y USB de distintas medidas, todos funcionando.",
      category: "electronica",
      neighborhood: "Barrio Pio Nono",
      status: "available",
      itemType: "donation",
      address: "Calle Pío Nono 450, Barrio Pío Nono",
      city: "Santiago",
      ...coords["Barrio Pio Nono"],
    },
    {
      donanteId: andresPid,
      title: "Muñecas (set de 4)",
      description: "Set de 4 muñecas en buen estado, con ropa incluida.",
      category: "juguetes",
      neighborhood: "Barrio Pio Nono",
      status: "available",
      itemType: "donation",
      address: "Calle Bellavista 500, Barrio Pío Nono",
      city: "Santiago",
      ...coords["Barrio Pio Nono"],
    },
    {
      donanteId: javieraPid,
      title: "Secadora de pelo Remington",
      description: "Secadora de pelo Remington 2200W, con difusor, en buen estado.",
      category: "electrodomesticos",
      neighborhood: "Barrio Pio Nono",
      status: "available",
      itemType: "donation",
      address: "Calle Pío Nono 200, Barrio Pío Nono",
      city: "Santiago",
      ...coords["Barrio Pio Nono"],
    },

    // ── Barrio Loreto: 2 items ───────────────────────────────────────────────
    {
      donanteId: carlosPid,
      title: "Revistas National Geographic (20 ed)",
      description: "20 ediciones de National Geographic en buen estado, varios años.",
      category: "libros",
      neighborhood: "Barrio Loreto",
      status: "available",
      itemType: "donation",
      address: "Calle Loreto 280, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Loreto"],
    },
    {
      donanteId: sofiaPid,
      title: "Mesa ratona de vidrio",
      description: "Mesa ratona con tapa de vidrio y estructura de metal, en buen estado.",
      category: "muebles",
      neighborhood: "Barrio Loreto",
      status: "available",
      itemType: "donation",
      address: "Calle Loreto 450, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Loreto"],
    },

    // ── Av. Vicuña Mackenna: 2 items ─────────────────────────────────────────
    {
      donanteId: diegoPid,
      title: "Herramientas básicas (martillo, llaves)",
      description: "Set de herramientas básicas: martillo, set de llaves y destornilladores.",
      category: "otros",
      neighborhood: "Av. Vicuña Mackenna",
      status: "available",
      itemType: "donation",
      address: "Av. Vicuña Mackenna 3000, Santiago Centro",
      city: "Santiago",
      ...coords["Av. Vicuña Mackenna"],
    },
    {
      donanteId: andresPid,
      title: "Sartén antiadherente 28cm",
      description: "Sartén antiadherente de 28cm marca Tramontina, en buen estado.",
      category: "otros",
      neighborhood: "Av. Vicuña Mackenna",
      status: "available",
      itemType: "donation",
      address: "Av. Vicuña Mackenna 3200, Santiago Centro",
      city: "Santiago",
      ...coords["Av. Vicuña Mackenna"],
    },

    // ── Barrio San Eugenio: 2 items ──────────────────────────────────────────
    {
      donanteId: javieraPid,
      title: "Silla plegable de playa",
      description: "Silla plegable de tela para playa o camping, en buen estado.",
      category: "otros",
      neighborhood: "Barrio San Eugenio",
      status: "available",
      itemType: "donation",
      address: "Calle San Eugenio 1000, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio San Eugenio"],
    },
    {
      donanteId: valentinaPid,
      title: "Uniformes de trabajo talla L",
      description: "Uniformes de trabajo color beige talla L, en buen estado.",
      category: "ropa",
      neighborhood: "Barrio San Eugenio",
      status: "available",
      itemType: "donation",
      address: "Calle San Eugenio 1200, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio San Eugenio"],
    },

    // ── Barrio Club Hípico: 1 item ───────────────────────────────────────────
    {
      donanteId: rodrigoPid,
      title: "Lego Duplo (caja grande)",
      description: "Caja grande con bloques Lego Duplo, piezas completas, bien lavados.",
      category: "juguetes",
      neighborhood: "Barrio Club Hípico",
      status: "available",
      itemType: "donation",
      address: "Av. Blanco Encalada 2400, Barrio Club Hípico",
      city: "Santiago",
      ...coords["Barrio Club Hípico"],
    },

    // ── Barrio Chuchunco: 1 item ─────────────────────────────────────────────
    {
      donanteId: camilaPid,
      title: "Sofá cama 2 cuerpos",
      description: "Sofá cama de 2 cuerpos, tela café, desplegable en buen estado.",
      category: "muebles",
      neighborhood: "Barrio Chuchunco",
      status: "available",
      itemType: "donation",
      address: "Calle Chuchunco 300, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Chuchunco"],
    },

    // ── Barrio Manuel Rodríguez: 2 items ─────────────────────────────────────
    {
      donanteId: andresPid,
      title: "Parlante JBL portátil",
      description: "Parlante JBL Clip 3 portátil, batería dura 10 horas, con mosquetón.",
      category: "electronica",
      neighborhood: "Barrio Manuel Rodríguez",
      status: "available",
      itemType: "donation",
      address: "Calle Manuel Rodríguez 460, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Manuel Rodríguez"],
    },
    {
      donanteId: javieraPid,
      title: "Ropa de invierno niño 6-8 años",
      description: "Ropa de invierno para niño talla 6-8 años: abrigos, poleras y pantalones.",
      category: "ropa",
      neighborhood: "Barrio Manuel Rodríguez",
      status: "available",
      itemType: "donation",
      address: "Calle Manuel Rodríguez 620, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Manuel Rodríguez"],
    },

    // ── Av. General Velásquez: 1 item ────────────────────────────────────────
    {
      donanteId: carlosPid,
      title: "Estante de baño con espejo",
      description: "Mueble de baño con espejo y 2 repisas, color blanco, sin daños.",
      category: "muebles",
      neighborhood: "Av. General Velásquez",
      status: "available",
      itemType: "donation",
      address: "Av. General Velásquez 2800, Santiago Centro",
      city: "Santiago",
      ...coords["Av. General Velásquez"],
    },

    // ── Barrio Quinta Normal: 2 items ────────────────────────────────────────
    {
      donanteId: sofiaPid,
      title: "Cajas de herramientas plástica",
      description: "Caja de herramientas plástica con bandeja, sin herramientas incluidas.",
      category: "otros",
      neighborhood: "Barrio Quinta Normal",
      status: "available",
      itemType: "donation",
      address: "Av. Quinta Normal 500, Santiago Centro",
      city: "Santiago",
      ...coords["Barrio Quinta Normal"],
    },
    {
      donanteId: diegoPid,
      title: "Olla arrocera eléctrica 1.8L",
      description: "Olla arrocera eléctrica 1.8 litros, con cuchara y vaso medidor.",
      category: "electrodomesticos",
      neighborhood: "Barrio Quinta Normal",
      status: "available",
      itemType: "donation",
      address: "Calle Mapocho 2300, Barrio Quinta Normal",
      city: "Santiago",
      ...coords["Barrio Quinta Normal"],
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

  // ── 7. Create item_photos (1 photo per item) ────────────────────────────────
  const categoryPhotoSeed: Record<string, string> = {
    muebles:          "muebles",
    electrodomesticos: "electro",
    ropa:             "ropa",
    electronica:      "electro",
    libros:           "libros",
    juguetes:         "juguetes",
    otros:            "otros",
  };

  let photoCount = 0;
  for (let i = 0; i < itemDefs.length; i++) {
    const def = itemDefs[i];
    const itemId = itemIdByTitle[def.title];
    const seedPrefix = categoryPhotoSeed[def.category];
    await db.insert(schema.itemPhotos).values({
      itemId,
      r2Key: `test/item_${i}.jpg`,
      r2Url: `https://picsum.photos/seed/${seedPrefix}${i}/600/400`,
      sizeBytes: 180000,
    });
    photoCount++;
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
    // idx=0
    {
      requesterId: jorgePid,
      recipientId: agrimPid,
      itemTitle: "Lavadora LG 10kg",
      matchType: "donante_fletero",
      status: "confirmed",
      tokenCost: 1,
    },
    // idx=1
    {
      requesterId: jorgePid,
      recipientId: agrimPid,
      itemTitle: "Caja ropa de invierno",
      matchType: "donante_fletero",
      status: "completed",
      tokenCost: 1,
    },
    // idx=2
    {
      requesterId: agrimPid,
      recipientId: luciaPid,
      itemTitle: "Mesa de comedor 6 personas",
      matchType: "cliente_cliente",
      status: "completed",
      tokenCost: 1,
    },
    // idx=3
    {
      requesterId: agrimPid,
      recipientId: pedroPid,
      itemTitle: "Refrigerador Mabe 350L doble puerta",
      matchType: "cliente_cliente",
      status: "completed",
      tokenCost: 1,
    },
    // idx=4
    {
      requesterId: jorgePid,
      recipientId: mariaPid,
      itemTitle: "Televisor 32 LG Smart",
      matchType: "donante_fletero",
      status: "confirmed",
      tokenCost: 1,
    },
    // idx=5
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
  // match idx=1: Caja ropa (completed)
  // match idx=2: Mesa (completed)
  // match idx=3: Refrigerador (completed)
  // match idx=5: Juguetes (completed)

  type ReviewDef = {
    matchIdx: number;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment: string;
  };

  const reviewDefs: ReviewDef[] = [
    // match idx=1: agrim reviews jorge, jorge reviews agrim
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
    // match idx=2: agrim reviews lucia, lucia reviews agrim
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
    // match idx=3: agrim reviews pedro, pedro reviews agrim
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
    // match idx=5: maria reviews jorge, jorge reviews maria
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
  // agrim: received 5 (jorge idx1), 4 (lucia idx2), 5 (pedro idx3) → avg 4.7
  // jorge: received 5 (agrim idx1), 4 (maria idx5) → avg 4.5
  // lucia: received 5 (agrim idx2) → avg 5.0
  // pedro: received 5 (agrim idx3) → avg 5.0
  // maria: received 5 (jorge idx5) → avg 5.0

  const ratingUpdates: Array<{ pid: string; avg: string }> = [
    { pid: agrimPid, avg: "4.7" },
    { pid: jorgePid, avg: "4.5" },
    { pid: luciaPid, avg: "5.0" },
    { pid: pedroPid, avg: "5.0" },
    { pid: mariaPid, avg: "5.0" },
  ];

  for (const u of ratingUpdates) {
    await db
      .update(schema.profiles)
      .set({ averageRating: u.avg })
      .where(eq(schema.profiles.id, u.pid));
  }

  console.log("Updated averageRating for all profiles.");

  // ── Summary ─────────────────────────────────────────────────────────────────
  const availableCount = itemDefs.filter((i) => i.status === "available").length;
  console.log("\n=== SEED COMPLETE ===");
  console.log(`Users: ${userData.length}`);
  console.log(`Items: ${itemDefs.length} total, ${availableCount} available (map markers)`);
  console.log(`Item photos: ${photoCount}`);
  console.log(`Matches: ${matchDefs.length}`);
  console.log(`Reviews: ${reviewDefs.length}`);
  console.log("\nUsers created (all password: test123):");
  for (const u of userData) {
    console.log(`  - ${u.email} (${u.name})`);
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
