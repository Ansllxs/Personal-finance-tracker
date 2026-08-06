# 💰 Finance Tracker

### Personal money + crochet business — in Costa Rican colones (₡)

A private, Spanish-language finance app for everyday spending **and** a small crochet side hustle. Track what you really have, log what you spend, plan budgets and goals, and keep orders, clients, and sales in one place.

> ✨ **You tell the app how much money you have.** It never invents balances — it only counts what you record.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and optional **Electron** for a native Mac desktop window. Clean fintech UI (slate + teal). Works in the browser, as a PWA, or as a Mac desktop app.

---

## 📑 Table of contents

1. [Why this exists](#-why-this-exists)
2. [Features](#-features)
3. [Tech stack](#-tech-stack)
4. [Quick start](#-quick-start)
5. [Scripts cheat sheet](#-scripts-cheat-sheet)
6. [Desktop app (Mac)](#-desktop-app-mac)
7. [PWA / install on phone](#-pwa--install-on-phone)
8. [App map (navigation)](#-app-map-navigation)
9. [How money works](#-how-money-works)
10. [Crochet module](#-crochet-module)
11. [Suggested weekly routine](#-suggested-weekly-routine)
12. [Data storage & privacy](#-data-storage--privacy)
13. [Project structure](#-project-structure)
14. [Optional Supabase](#-optional-supabase)
15. [Design system](#-design-system)
16. [Important concepts](#-important-concepts)
17. [Troubleshooting](#-troubleshooting)
18. [Security notes](#-security-notes)
19. [Author](#-author)

---

## 💡 Why this exists

Most finance apps either:

- connect to banks (overkill / scary for a personal tool), or  
- force a rigid “budget template” that doesn’t match real life.

**Finance Tracker** is different:

| Principle | What it means |
|-----------|----------------|
| 🎯 **Truthful balances** | You set the real balance on each account. The app updates from your logs. |
| 🇨🇷 **Colones first** | Built for ₡, Spanish UI, local payment methods (SINPE, cash, transfer). |
| 🧶 **Business + personal** | Personal spending and crochet sales live together without mixing the story. |
| 💻 **Your machine** | Default storage is a local JSON file — not a public cloud by default. |
| 🧼 **Calm UI** | Clean slate/teal fintech look. No clutter, no fake “bank sync” magic. |

---

## ✨ Features

### 🏠 Dashboard (Inicio)
- Greeting + monthly overview  
- **Available** balance across accounts  
- Income and expenses for the selected month  
- Goals snapshot  
- Recent personal transactions  
- Floating **Sumar** button to add money movements fast  

### 📒 Transactions (Gastos / Movimientos)
- Full history with month navigation (← →)  
- Personal tag filtering in day-to-day views  
- Quick add via **Sumar**: Expense · Income · Goal contribution  

### 🏦 Accounts (Cuentas)
- Bank, cash, credit card, savings envelope  
- Edit / set “how much do I have right now?”  
- Monthly in/out per account  
- **SINPE is a payment method**, not a separate wallet  

### 📊 Budget (Presupuesto)
- Split the month your way (suggested needs / wants / savings helpers)  
- Track progress without rigid templates  

### 🎯 Goals & wishlist (Metas)
- Savings goals with progress bars  
- Wishlist items (want / saving / bought)  
- Goal contributions **debit the chosen account** and increase the goal  

### 🧶 Crochet business
- Dashboard: monthly sales, active orders, receivables, weekly deliveries  
- **Orders** — commissions with status filters  
- **Finished pieces (Hechos)** — inventory ready to sell  
- **Clients** — who orders from you  
- **Materials & finances** — deeper tracking when you need it  
- **Registrar pago** / **Registrar venta** so money actually hits an account  

### ⚙️ Settings & more (Más / Ajustes)
- Profile basics  
- Export / reports entry points  
- Reset / how-to guidance  
- Theme support (light / dark via `next-themes`)  

### 📱 Surfaces
- Responsive web (desktop sidebar + mobile bottom nav)  
- PWA installable  
- Mac desktop via Electron  

---

## 🧰 Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router, Turbopack in `dev`) |
| Language | **TypeScript** |
| UI | **React 19**, **Tailwind CSS 4**, Radix primitives |
| Forms | **react-hook-form** + **Zod** |
| Charts | **Recharts** |
| Icons | **Lucide** |
| Toasts | **Sonner** |
| Desktop | **Electron** + **electron-builder** (Mac `.dmg` / `.zip`) |
| Optional cloud | **Supabase** (SSR helpers + SQL migrations) |
| Fonts | **DM Sans** |
| Theme accent | Teal `#0F766E` on cool neutrals |

---

## 🚀 Quick start

### Requirements
- **Node.js** 20+ recommended (22 works)  
- **npm**  
- macOS if you want the Electron desktop / `.dmg` pack  

### Install & run (browser)

```bash
# 1) Clone
git clone <your-repo-url>
cd Personal-finance-tracker-1

# 2) Install dependencies
# Tip: Electron’s binary download can time out on slow networks.
# For web-only work you can skip the Electron binary:
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install

# Or a normal install:
npm install

# 3) Start the Next.js dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**  

✅ No login required for the default local mode — you land on the app immediately.

### Browser data location

```text
.data/store.json
```

This folder is gitignored. Don’t commit it.

---

## 🧾 Scripts cheat sheet

| Command | What it does |
|---------|----------------|
| `npm run dev` | 🌐 Next.js development server (`localhost:3000`) |
| `npm run build` | 🏗️ Production web build |
| `npm run start` | ▶️ Serve the production web build |
| `npm run lint` | 🔍 ESLint |
| `npm run desktop` | 🖥️ Open the Electron desktop window (dev-friendly) |
| `npm run desktop:dev` | 🖥️ Same as `desktop` |
| `npm run desktop:prod` | 🖥️ Build Next, then open Electron in production mode |
| `npm run desktop:prepare` | 📦 Build + prepare standalone bundle for packaging |
| `npm run desktop:pack` | 💿 Create Mac `.dmg` / `.zip` under `dist-desktop/` |

---

## 🖥️ Desktop app (Mac)

Run a dedicated window that stores data in Application Support (survives project moves).

```bash
npm install
npm run desktop
```

### Where desktop data lives

```text
~/Library/Application Support/Finance Tracker/data/store.json
```

### First-run migration
If `store.json` doesn’t exist yet in Application Support, Electron can **copy** an existing browser store from the project’s `.data/store.json` once.

> ⚠️ Browser (`npm run dev`) and desktop (`npm run desktop`) use **different folders**. You can run both, but they won’t share live edits.

### Build an installer

```bash
npm run desktop:pack
```

Outputs land in `dist-desktop/`.  
The first Electron binary download may need network access.

Electron listens on a local port (default **3847**, overridable with `FINANCE_TRACKER_PORT`).

---

## 📱 PWA / install on phone

The app ships with `public/manifest.webmanifest` and icons.

| Platform | How |
|----------|-----|
| 🍎 **iPhone** | Safari → Share → **Add to Home Screen** |
| 💻 **Desktop Chrome / Edge** | Install icon in the address bar / browser menu |
| 🎨 Theme color | `#0F766E` |

---

## 🗺️ App map (navigation)

| Route | Label | Purpose |
|-------|-------|---------|
| `/` | Inicio | Dashboard & Sumar FAB |
| `/movimientos` | Gastos | Transaction list by month |
| `/cuentas` | Cuentas | Account balances |
| `/presupuesto` | Presupuesto | Monthly budget |
| `/metas` | Metas | Goals + wishlist |
| `/crochet` | Crochet | Business hub |
| `/crochet/pedidos` | Pedidos | Orders |
| `/crochet/productos` | Hechos / products | Finished goods |
| `/crochet/clientes` | Clientes | Clients |
| `/crochet/materiales` | Materiales | Materials |
| `/crochet/finanzas` | Finanzas | Crochet finances |
| `/ajustes` | Más | Settings & extras |
| `/reportes` | Reportes | Reports |

Mobile uses a 7-item bottom nav; desktop uses a left sidebar.

---

## 💵 How money works

### The **Sumar** button (your main shortcut)

| Mode | Use it for |
|------|------------|
| 💸 **Gasto** | Amount, category, account, payment method (SINPE / cash / transfer) |
| 💚 **Ingreso** | Money in (salary, scholarship “beca”, gifts, etc.) |
| 🎯 **Meta** | Contribution that **decreases** the account and **increases** the goal |

### Accounts (no lies)

1. Open **Cuentas**  
2. Tap **Editar / poner saldo**  
3. Enter what you *actually* have (zero is fine)  
4. From then on, logged income/expenses move the balance  

### Rules of thumb

- ❌ Don’t create a “SINPE account” — SINPE is *how* money moves  
- ✅ Bank / cash / card hold the money  
- ✅ Goal contributions are not “free” savings — they come from an account  

---

## 🧶 Crochet module

Crochet is a mini ERP for a handmade business:

| Area | What you do |
|------|-------------|
| **Pedidos** | Track commissions (consulta → confirmado → en proceso → …) |
| **Hechos** | Finished pieces ready to sell |
| **Clientes** | Customer list |
| **Materiales / Finanzas** | Costs and deeper money views |

### 🥇 Golden tips

1. When a client pays an order → use **Registrar pago** (so the money hits an account).  
2. When you sell a finished piece → use **Registrar venta** (inventory down + income up).  
3. Marking something “paid” without registering payment does **not** move balances.

---

## 🗓️ Suggested weekly routine

1. Set real balances in **Cuentas**  
2. Spend something → **Sumar → Gasto**  
3. Money arrives (beca / salary / sale) → **Sumar → Ingreso**  
4. Save toward a dream → **Sumar → Meta**  
5. New commission → **Crochet → Pedidos**  
6. Client pays → **Registrar pago**  
7. Piece finished → **Hechos**; sold → **Registrar venta**  
8. End of month → flip month on Inicio / Gastos and review  

---

## 🗄️ Data storage & privacy

| Mode | Path |
|------|------|
| 🌐 Browser / `next dev` | `.data/store.json` (project root) |
| 🖥️ Electron desktop | `~/Library/Application Support/Finance Tracker/data/store.json` |

- Local by default — great for a personal tool  
- `.data/` is gitignored  
- No automatic bank sync  
- No invented debts or balances  

Optional cloud (Supabase) is available if you want multi-device later — see below.

---

## 📁 Project structure

```text
Personal-finance-tracker-1/
├── src/
│   ├── app/                 # Next.js App Router pages & layouts
│   ├── components/          # UI, layout, feature clients
│   ├── lib/                 # Finance logic, data access, types, constants
│   └── middleware.ts        # Auth/proxy helpers (Supabase-ready)
├── electron/
│   ├── main.cjs             # Electron main process
│   └── preload.cjs          # Preload bridge
├── scripts/
│   └── prepare-standalone.mjs
├── public/                  # PWA icons + manifest
├── supabase/
│   ├── migrations/          # Optional SQL schema
│   └── seed.sql
├── .data/                   # Local browser store (not committed)
├── dist-desktop/            # Packaged Mac builds (after pack)
├── .env.example             # Supabase env template
├── package.json
└── README.md
```

---

## ☁️ Optional Supabase

Default mode does **not** need Supabase. Local JSON is enough.

If you want cloud sync / auth later:

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill values from Supabase → Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Apply SQL under `supabase/migrations/` (and optional `seed.sql`).

⚠️ **Never commit** `.env.local` or service-role keys.

Helpers live in:

- `src/lib/supabase/client.ts`  
- `src/lib/supabase/server.ts`  
- `src/lib/supabase/middleware.ts`  

---

## 🎨 Design system

Professional **fintech-clean** look (not scrapbook):

| Token role | Feel |
|------------|------|
| Background | Cool off-white `#F7F8FA` |
| Surfaces | Clean white cards |
| Primary | Teal `#0F766E` |
| Text | Slate ink + muted slate |
| Type | DM Sans throughout |
| Motion | Subtle fade-ins; no pulsing neon FAB |

Legacy CSS variable names (`--rose-dust`, `--cream`, etc.) are **remapped** to the new palette so existing Tailwind class names keep working without a repo-wide rename.

Dark mode: same slate + teal system under `.dark`.

---

## 🧠 Important concepts

| Idea | Plain English |
|------|----------------|
| **Current balance** | What *you* typed; then movements update it |
| **SINPE** | Payment rail / method — not an account |
| **Registrar pago** | Order payment that credits an account |
| **Registrar venta** | Finished-piece sale + income |
| **Goal contribution** | Savings that leave an account and enter a goal |
| **Personal vs crochet** | Tags / modules keep stories readable |
| **Month nav** | Dashboard & lists are month-scoped |

---

## 🛟 Troubleshooting

### `npm` / `node` not found
Make sure Node is on your `PATH` (nvm, Homebrew, or a local Node install such as `~/.local/node/bin`).

### `npm install` idle timeout (`EIDLETIMEOUT`)
Registry or Electron download stalled. Try:

```bash
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --fetch-timeout=300000 --fetch-retries=5
```

### Port 3000 already in use
Stop the other process, or run Next on another port:

```bash
npx next dev -p 3001
```

### Desktop window won’t open
Use the npm scripts (they unset `ELECTRON_RUN_AS_NODE`):

```bash
npm run desktop
```

Don’t run `node electron/main.cjs` directly.

### Browser and desktop show different numbers
Expected — different `store.json` locations. Pick one surface as source of truth, or copy the JSON carefully.

### Stale UI after a big design change
Hard refresh the browser (`Cmd+Shift+R`) while `npm run dev` is running.

---

## 🔒 Security notes

- Designed for **personal / private** use on your machine (or a private deploy)  
- No automatic bank access  
- Treat `.data/store.json` like a password file if it has real amounts  
- Keep `.env.local` out of git  
- If you deploy publicly, add real auth and never expose service keys  

---

## 👩‍💻 Author

Made by **Angie** · Finance Tracker · ₡

Track every colón. Ship every stitch. 🧶💚

---

### License

Private project (`"private": true` in `package.json`). All rights reserved unless you add a license file.
