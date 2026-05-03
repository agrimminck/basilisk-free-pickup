# Basilisk Free Pickup — Overview

**Path:** `/home/agrim/github/idyllic/repos/basilisk-free-pickup`
**Creado:** 2026-05-02. **Estado:** MVP — pendiente R2, pagos, geolocalización.

---

## Propósito

Conectar donantes (quieren regalar items) con fleteros (camioneros que los retiran). Modelo: fleteros pagan suscripción por leads, donantes reciben storage de fotos gratis (pueden pagar costo R2 por más).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 App Router |
| Lenguaje | TypeScript |
| Styling | Tailwind CSS v4 (`@theme` en CSS, sin `tailwind.config.ts`) |
| Auth | Better Auth (email + Google OAuth) |
| DB | Neon PostgreSQL — schema `free_pickup` |
| ORM | Drizzle |
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
| `account` | Better Auth — credenciales |
| `verification` | Better Auth — verificaciones |
| `profiles` | id, user_id, role (donante/fletero), full_name, phone, storage_used_bytes, storage_limit_bytes, company_name, truck_capacity_m3 |
| `items` | id, donante_id, title, description, category, status, address, neighborhood, city, lat, lng, reserved_by_fleeter_id |
| `item_photos` | id, item_id, r2_key, r2_url, size_bytes |
| `fleeter_subscriptions` | id, fleeter_id, plan, leads_limit, leads_used, current_period_start, current_period_end, active |
| `donante_storage_payments` | id, donante_id, bytes_purchased, amount_paid_cents |

### Enums

| Enum | Valores |
|------|---------|
| `role` | `donante`, `fletero` |
| `item_category` | `muebles`, `electrodomesticos`, `ropa`, `electronica`, `juguetes`, `libros`, `otros` |
| `item_status` | `available`, `reserved`, `picked_up` |
| `subscription_plan` | `basic`, `premium`, `unlimited` |

**Importante schema:** tablas en schema `free_pickup` — NO en `public`. Usar siempre `pgSchema("free_pickup")` en Drizzle.

---

## Variables de entorno

```bash
# .env.local
DATABASE_URL=postgresql://neondb_owner:<pw>@ep-muddy-forest-acsgvbxh.sa-east-1.aws.neon.tech/neondb?schema=free_pickup&sslmode=require
BETTER_AUTH_SECRET=<generado>
BETTER_AUTH_URL=http://localhost:3007          # producción: https://basilisk-free-pickup.vercel.app
NEXT_PUBLIC_APP_URL=http://localhost:3007
CLOUDFLARE_R2_ACCOUNT_ID=                      # pendiente
CLOUDFLARE_R2_ACCESS_KEY_ID=                   # pendiente
CLOUDFLARE_R2_SECRET_ACCESS_KEY=               # pendiente
CLOUDFLARE_R2_BUCKET_NAME=free-pickup
NEXT_PUBLIC_R2_PUBLIC_URL=                     # pendiente
```

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
npm run db:push        # drizzle-kit push (requiere DATABASE_URL)
npm run db:studio      # drizzle-kit studio
```

**Pitfall schema:** `drizzle-kit push` con `?schema=free_pickup` en URL NO crea tablas en ese schema automáticamente. Solución: usar `pgSchema("free_pickup")` en schema files + crear schema primero con `CREATE SCHEMA IF NOT EXISTS free_pickup` via psql directo.

---

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | público | landing page |
| `/items` | público | grid items con filtros |
| `/items/new` | donante | crear item + upload fotos |
| `/items/[id]` | público | detalle item |
| `/dashboard` | auth | role-aware: donante → items + storage, fletero → suscripciones + leads |
| `/api/auth/[...all]` | handler | Better Auth |

---

## Componentes

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `navbar` | `components/` | navegación principal, auth-aware |
| `item-card` | `components/` | card item en grid |
| `photo-upload` | `components/` | upload fotos (pendiente R2) |
| `storage-indicator` | `components/` | indicador storage donante |
| `login-form` | `components/auth/` | formulario login |
| `register-form` | `components/auth/` | formulario registro con selector rol |
| UI primitives | `components/ui/` | button, card, input, textarea, select, badge, dialog |

---

## Deploy

- **URL producción:** https://basilisk-free-pickup.vercel.app (pendiente configurar)
- **Proyecto Vercel:** `agrimmincks-projects/basilisk-free-pickup` (pendiente crear)

---

## Pendiente

- **R2 integration:** configurar bucket `free-pickup`, presigned URLs, upload en `photo-upload`, storage en `item_photos`
- **Pagos:** integrar pasarela (MercadoPago/Stripe) para suscripciones fleteros + storage extra donantes
- **Geolocalización:** mapa items, filtro por distancia, cálculo rutas fleteros
- **Cuentas test:** crear seed script con donantes + fleteros + items de prueba
- **Consolidar `lib/db.ts` y `lib/db/index.ts`** — duplicados
- **Unificar convención schema:** `lib/schema.ts` usa `pgSchema("free_pickup")`, `lib/db/schema.ts` usa `pgTable` sin schema — elegir uno
