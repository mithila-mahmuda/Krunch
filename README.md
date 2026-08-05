# Krunch — Restaurant Management Software

Touch-first POS and operations suite for restaurants, cafés, and bars.

## What's included (Phase 1)

- **POS Till** — category grid, ticket, promotions, **Hold / Send Kitchen / Pay**
- **Shared ops store** — Orders, Kitchen, Tables, Inventory, and Reports share one order model
- **Local IndexedDB tables** — `orders`, `floor_tables`, `inventory_items`, `customers`, `products`, etc. (browser-native, no WASM)
- **Menu → POS** — sold-out toggles block till sales
- **Settings → till math** — tax/service/till name persist and drive totals
- **Staff** — email/password + Google (demo), role gates (void, settings, menu, inventory)
- **No cloud backend yet** — durable browser tables; RDS/Supabase later for multi-device sync

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in, then use the till.

**Demo staff:** `kyle@krunch.app` / `till1234` · Maya `maya@krunch.app` / `till5678` · Sam `sam@krunch.app` / `till9012`

## Local storage

- Database name: `krunch` (IndexedDB)
- Object stores listed in `src/lib/db/schema.ts`
- Read/write helpers in `src/lib/db/repos.ts`

When you move to RDS, map each object store to a Postgres table (split `orders.lines` into `order_lines`).

## Suggested product roadmap

1. **Backend** — Hosted Postgres (RDS/Supabase): auth, menu, orders, realtime kitchen
2. **Hardware** — receipt printer + cash drawer drivers
3. **Payments** — card terminal / split payment / tips
4. **Menu CRUD** — categories, prices, promotions editor
5. **Inventory** — purchase orders, waste, fuller recipe BOM

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zustand
- IndexedDB
- Lucide icons
