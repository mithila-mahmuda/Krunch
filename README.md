# Krunch — Restaurant Management Software

Touch-first POS and operations suite for restaurants, cafés, and bars.

## What's included (Phase 1)

- **POS Till** — Epos-style category grid, product tiles, live ticket, qty/note/discount controls, promotions, service toggle, pay / layaway actions
- **App navigation** — Orders, Kitchen Display, Tables, Customers, Menu, Inventory, Reports, Settings (scaffolded for next phases)
- **Local state** — Zustand cart + mock menu data (no backend yet)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you are redirected to `/pos`.

## Suggested product roadmap

1. **POS polish** — payment screen, cash/card split, receipt print, misc product
2. **Backend** — Supabase (auth, menu, orders, realtime kitchen)
3. **Kitchen Display** — bump tickets from POS in realtime
4. **Tables & Tabs** — floor plan + open tabs
5. **Menu Manager** — CRUD categories/products/promotions
6. **Inventory & Reports** — stock, Z-reports, sales analytics
7. **Staff** — PIN login, roles, till permissions

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zustand
- Lucide icons
