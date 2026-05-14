# Basilisk Free Pickup — Overview

**Path:** `/home/agrim/github/idyllic/repos/basilisk-free-pickup`
**Estado:** MVP funcional — pendiente R2, pagos reales, geolocalización avanzada.
**Deploy prod:** https://basilisk-free-pickup.vercel.app

---

## Propósito

Conectar donantes (quieren regalar items) con fleteros (camioneros que los retiran) y clientes (reciben cosas directamente). Modelo token: 4 matches gratis/mes → pagan tokens adicionales. Donantes reciben storage fotos gratis (R2 pendiente).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 App Router |
| Lenguaje | TypeScript |
| Styling | Tailwind CSS v4 (`@theme` en CSS, sin `tailwind.config.ts`) |
| Auth | Better Auth v1.2.x (email + Google OAuth) |
| DB | Neon PostgreSQL — schema `free_pickup` |
| ORM | Drizzle |
| Mapa | Leaflet + React Leaflet (dynamic import, ssr:false) |
| Deploy | Vercel |
| Puerto dev | 3007 |

---

## DB — Neon basilisk-prod

- **Schema:** `free_pickup`
- **CONNECTION_STRING:** `postgresql://neondb_owner:<pw>@ep-muddy-forest-acsgvbxh.sa-east-1.aws.neon.tech/neondb?schema=free_pickup&sslmode=require`
- Password en `basilisk-infra/.env` → `NEON_PASSWORD`

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `user` | Better Auth — usuarios |
| `session` | Better Auth — sesiones |
| `account` | Better Auth — credenciales (password: `salt:hash` scrypt N=16384 r=16 p=1 dkLen=64) |
| `verification` | Better Auth — verificaciones |
| `profiles` | id, user_id, role, full_name, phone, tokens_balance, free_matches_used, free_matches_reset_at, average_rating |
| `items` | id, donante_id, title, description, category, item_type, price, status, address, neighborhood, city, lat, lng, reserved_by_fleeter_id |
| `item_photos` | id, item_id, r2_key, r2_url, size_bytes — **pendiente R2** (seed usa picsum.photos) |
| `matches` | id, requester_id, recipient_id, item_id, match_type, status, token_cost |
| `reviews` | id, match_id, reviewer_id, reviewee_id, rating, comment |
| `token_transactions` | id, profile_id, amount, transaction_type, description, match_id |
| `token_purchases` | id, profile_id, amount_paid_cents, tokens_purchased, status, preference_id, mp_payment_id, mp_init_point |

### Enums

| Enum | Valores |
|------|---------|
| `role` | `donante`, `fletero`, `cliente` |
| `item_category` | `muebles`, `electrodomesticos`, `ropa`, `electronica`, `juguetes`, `libros`, `otros` |
| `item_status` | `available`, `reserved`, `picked_up` |
| `item_type` | `donation`, `sale` |
| `match_type` | `donante_fletero`, `cliente_cliente` |
| `match_status` | `pending`, `confirmed`, `completed`, `cancelled` |
| `token_transaction_type` | `purchase`, `match_spend`, `free_match`, `refund`, `bonus` |
| `token_purchase_status` | `pending`, `completed`, `failed` |

**Pitfall schema:** `drizzle-kit push` con `?schema=free_pickup` NO crea schema automáticamente. Solución: `CREATE SCHEMA IF NOT EXISTS free_pickup` via psql antes.

**Pitfall tsconfig:** `scripts/` excluido del build TypeScript en `tsconfig.json` — necesario para que Vercel no type-check los seeds.

---

## Variables de entorno

```bash
DATABASE_URL=postgresql://neondb_owner:<pw>@ep-muddy-forest-acsgvbxh.sa-east-1.aws.neon.tech/neondb?schema=free_pickup&sslmode=require
BETTER_AUTH_SECRET=<generado>
BETTER_AUTH_URL=https://basilisk-free-pickup.vercel.app   # prod; localhost:3007 en dev
NEXT_PUBLIC_APP_URL=https://basilisk-free-pickup.vercel.app
GOOGLE_CLIENT_ID=                      # opcional
GOOGLE_CLIENT_SECRET=                  # opcional
MERCADOPAGO_ACCESS_TOKEN=              # pendiente configurar en prod
MERCADOPAGO_PUBLIC_KEY=                # pendiente configurar en prod
# R2 — pendiente:
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=free-pickup
NEXT_PUBLIC_R2_PUBLIC_URL=
```

Todas las vars de prod están configuradas en Vercel (encriptadas).

---

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | público | landing page |
| `/items` | auth | grid items con filtros + mapa interactivo |
| `/items/new` | auth | crear item + upload fotos (placeholder sin R2) |
| `/items/[id]` | auth | detalle item |
| `/matches` | auth | lista mis matches |
| `/matches/[id]/review` | auth | dejar review post-match completado |
| `/reviews` | auth | mis reviews recibidas |
| `/dashboard` | auth | stats: tokens, matches, items, rating |
| `/tokens` | auth | comprar tokens (MercadoPago) |
| `/api/auth/[...all]` | handler | Better Auth |
| `/api/items` | GET/POST | listar items (mine=true filtra propios) / crear |
| `/api/items/[id]` | GET/PUT/DELETE | detalle / actualizar / eliminar |
| `/api/matches` | GET/POST | listar matches / crear match |
| `/api/matches/[id]` | GET | detalle match |
| `/api/matches/[id]/confirm` | POST | confirmar match |
| `/api/matches/[id]/complete` | POST | completar match |
| `/api/reviews` | GET/POST | reviews del usuario / crear review |
| `/api/tokens/balance` | GET | balance tokens + free matches |
| `/api/tokens/purchase` | POST | iniciar compra MercadoPago |
| `/api/tokens/purchase/status` | GET | estado compra |
| `/api/tokens/webhook` | POST | webhook MercadoPago |
| `/api/user/me` | GET | perfil usuario autenticado (canónico) |

---

## Mapa interactivo

`components/map.tsx` — Leaflet con clusters por ubicación.

- **Clustering:** agrupa items por lat/lng redondeado a 3 decimales (~100m radio)
- **Marcadores:** `L.divIcon` círculo verde `#16a34a`, número blanco = cantidad items en cluster
- **Solo muestra `available`** — items reservados/retirados no aparecen
- **Dark mode:** tile alternativo CartoDB dark
- **Import:** siempre dynamic con `ssr: false` (Leaflet usa `window`)

```tsx
const Map = dynamic(() => import("@/components/map"), { ssr: false });
```

Ubicado en `/items` page sobre la grilla de items.

---

## Seed — cuentas de testeo

Script: `scripts/seed.ts` — ejecutar con `npx tsx scripts/seed.ts`

**Borra** todo en orden FK-safe antes de insertar. **65 items en Santiago Centro, 13 usuarios, 30 barrios distintos.**

| Email | Password | Rol | Descripción |
|-------|----------|-----|-------------|
| agrim@test.com | test123 | donante | cuenta principal demo |
| maria@test.com | test123 | donante | publicó 5 items |
| jorge@test.com | test123 | fletero | pedidos confirmados + completados |
| lucia@test.com | test123 | donante | le dio mesa a agrim |
| pedro@test.com | test123 | donante | le dio refrigerador a agrim |

**Reviews seeded:** en matches completed, bidireccionales.

---

## Modelo tokens

- 4 matches gratis/mes (`FREE_MATCHES_PER_MONTH` en `lib/tokens.ts`)
- Cada match adicional = 1 token
- Precio token: `TOKEN_PRICE_CLP` en `lib/tokens.ts` (1000 CLP)
- `lib/data.ts` re-exporta ambas constantes para UI consumers
- Compra vía MercadoPago (webhook en `/api/tokens/webhook`) — **pendiente credenciales prod**

---

## Arquitectura lib/

| Archivo | Rol |
|---------|-----|
| `lib/tokens.ts` | Lógica tokens: FREE_MATCHES_PER_MONTH, TOKEN_PRICE_CLP, spendMatchToken, addTokens, recalculateAverageRating |
| `lib/clustering.ts` | clusterItems puro (lat/lng round 3 dec). Extraído de `components/map.tsx` para test. |
| `lib/data.ts` | Constantes UI: CATEGORIES, CITIES. Re-exporta FREE_MATCHES_PER_MONTH + TOKEN_PRICE_CLP desde tokens.ts |
| `lib/types.ts` | Tipos DB-aligned: Profile, Item, Match, Review, TokenBalance |
| `lib/auth.ts` | Better Auth server config + drizzle adapter + databaseHook crea profile en registro |
| `lib/auth-client.ts` | Better Auth client (signIn, signUp, signOut, useSession) |
| `lib/db.ts` | Drizzle + Neon HTTP driver |
| `lib/utils.ts` | cn() helper (clsx + tailwind-merge) |

---

## Dev local

```bash
cd /home/agrim/github/idyllic/repos/basilisk-free-pickup
npm install --legacy-peer-deps
cp .env.local.example .env.local  # llenar credenciales
npm run dev  # http://localhost:3007
```

---

## Scripts DB

```bash
npm run db:generate    # drizzle-kit generate
npm run db:migrate     # drizzle-kit migrate
npm run db:push        # drizzle-kit push
npm run db:studio      # drizzle-kit studio
npx tsx scripts/seed.ts  # seed prod (borra y re-inserta todo)
```

---

## Tests

Stack: **Vitest 4 + RTL + jsdom**. Config: `vitest.config.ts`. Setup: `tests/setup.ts`. Comandos: `npm test`, `npm run test:watch`, `npm run test:coverage`.

**42 tests / 5 archivos** (Fase 1 baseline):

| Archivo | Cubre |
|---------|-------|
| `lib/clustering.test.ts` | clusterItems: NaN/Infinity skip, mismo bucket 3-dec, keys estables, empty |
| `lib/tokens.test.ts` | spendMatchToken: free→token→reject, reset boundary UTC mes/año, canSpendMatchToken |
| `app/api/matches/route.test.ts` | POST match: 401/400/402, self-match, atomic insert+spend, tx rollback (no orphan, no wasted token) |
| `app/api/reviews/route.test.ts` | POST review: 401/400/403/409, bounds rating 1-5, recalc avg, self-review, match completed gate |
| `app/api/tokens/webhook/route.test.ts` | MP IPN: idempotency completed, approved→credit, rejected→failed, MP API fail silent, race flag, **HMAC signature: valid/invalid/missing headers/dev warn/prod 503** |

DB: mocks in-memory (Drizzle + auth). Real Neon test schema pendiente fase 2.

**Bugs flagged en tests** (documentados, no fixed):
- `tokens/webhook`: check-then-act sin row lock. Dos IPN approved concurrentes podrían pasar el guard `status !== 'completed'` y doble-creditar. Mitigación: `SELECT ... FOR UPDATE` o constraint único en `mp_payment_id`.

**Bugs FIXED:**
- `matches/route.ts` double-spend / orphan match: **FIXED**. Nuevo helper `spendTokenAndCreateMatch` en `lib/tokens.ts` envuelve `insert matches` + decrement (`free_matches_used` o `tokens_balance`) + `insert token_transactions` en un solo `db.transaction(...)` (neon-http batch). Si cualquier paso falla → rollback completo: no orphan match, no token consumido. Re-chequea balance dentro de la tx para cerrar la race read-then-act entre `canSpendMatchToken` y el debit.
- `tokens/webhook` MP signature validation: **FIXED** (HMAC SHA256 via `lib/mp-signature.ts`). Valida `x-signature` + `x-request-id` contra `MERCADOPAGO_WEBHOOK_SECRET`. Manifest: `id:<id>;request-id:<rid>;ts:<ts>;`. Timing-safe compare. Sin secret en prod → 503. Sin secret en dev → warn + permite.

---

## Pendiente

- **R2 integration:** bucket `free-pickup`, presigned URLs, upload real en `items/new`, storage en `item_photos`
- **Pagos reales:** MercadoPago access token prod → activar flujo tokens
- **Geolocalización avanzada:** filtro por distancia, rutas fleteros
- **Google OAuth:** configurar redirect URIs en Google Console para prod
