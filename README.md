# Finance Tracker

Aplicación web personal (privada, una sola usuaria) para finanzas en **colones costarricenses (₡)** y el emprendimiento de crochet. Interfaz en español, responsive (Mac e iPhone), instalable como PWA.

Estética scrapbook / coquette: rosa empolvado, crema, gingham azul suave, salvia y detalles de papel.

**Stack:** Next.js (App Router) + TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth + PostgreSQL) · Recharts · Lucide React

---

## Requisitos

- Node.js 20+
- npm

## Modo local (sin login)

Por defecto la app **no pide inicio de sesión**. Los datos se guardan en `.data/store.json` y se siembran solos al abrir (Beca U, cuentas, metas, crochet…).

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — entras directo al dashboard.

Completa saldos y deuda en **Cuentas**. Para reiniciar: **Ajustes → Reiniciar datos de ejemplo**.

> Opcional: el SQL de Supabase en `supabase/migrations/` queda por si más adelante quieres Auth en la nube.

## PWA

- **iPhone (Safari):** Compartir → Añadir a pantalla de inicio.
- **Mac:** menú de instalación del navegador.

## Seguridad

- RLS por `user_id`: solo ves tus datos.
- Sin conexión bancaria ni SINPE automática.
- No subas `.env.local` al repositorio.

## Scripts

| Comando         | Descripción      |
|-----------------|------------------|
| `npm run dev`   | Desarrollo       |
| `npm run build` | Build producción |
| `npm run start` | Servir build     |
| `npm run lint`  | ESLint           |
