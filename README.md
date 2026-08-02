# Finance Tracker

Registro personal de finanzas en **colones costarricenses (₡)** y del negocio de **crochet**.  
App privada (una usuaria), en español, responsive (Mac / iPhone) e instalable como PWA.

Sin inventar saldos: tú pones cuánto tienes; la app solo suma y resta lo que registres.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · componentes estilo shadcn/ui · Recharts · Lucide · datos locales (JSON) · Supabase opcional

**Look:** scrapbook / coquette — rosa empolvado, crema, gingham azul, salvia, tipografía Fraunces + Nunito.

---

## Arranque rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Entras directo (sin login).

Los datos viven en `.data/store.json` (ignorado por git). Si no hay nada, se crea una base mínima: cuentas en ₡0, categorías y estructura de crochet — **sin montos inventados**.

| Comando         | Qué hace              |
|-----------------|-----------------------|
| `npm run dev`   | Desarrollo            |
| `npm run build` | Build de producción   |
| `npm run start` | Servir el build       |
| `npm run lint`  | ESLint                |

---

## Qué incluye

### Menú principal

| Ruta | Sección | Para qué |
|------|---------|----------|
| `/` | **Inicio** | Disponible, ingresos/gastos del mes, últimos registros, **Sumar** (Gasté / Me entró) |
| `/movimientos` | **Gastos** | Lista del mes, filtros, editar/borrar/duplicar |
| `/cuentas` | **Cuentas** | Saldos reales, efectivo, banco, tarjeta |
| `/presupuesto` | **Presupuesto** | Asignar ingreso esperado por categoría |
| `/metas` | **Metas** | Ahorros / wishlist |
| `/crochet` | **Crochet** | Pedidos, hechos, clientes, ventas |
| `/ajustes` | **Más** | Perfil, categorías, exportar, reiniciar, reportes |

Mes ← → en Inicio, Gastos y Presupuesto.

---

## Finanzas personales

### Sumar (botón flotante)

- **Gasté** — monto, categoría, de qué cuenta salió, cómo pagaste (SINPE / efectivo / transferencia).
- **Me entró** — monto, categoría, a qué cuenta, cómo te pagaron.
- Atajo **Entró la beca** (usa el ingreso mensual de Ajustes si lo definiste).
- Otros: transferencia, pago de tarjeta, crochet, aporte a meta.

### Cuentas

- Tipos: cuenta bancaria, efectivo, tarjeta, sobre de ahorro.
- **SINPE no es una cuenta**: es forma de pago/cobro; el dinero vive en el banco (o efectivo).
- En cada cuenta: **Editar / poner saldo** → “¿Cuánto tienes ahora?”
- Por mes: cuánto entró y salió en esa cuenta.
- Tarjeta: deuda, límite, corte, día de pago (todo editable).

### Presupuesto y metas

- Presupuesto del mes con montos que tú defines.
- Metas de ahorro y wishlist; aportes desde movimientos.

### Reportes

- En **Más → Reportes**: periodos y resúmenes (no está en la barra inferior para no saturar).

---

## Crochet

Hub `/crochet`: ventas del mes, pedidos activos, **por cobrar**, entregas de la semana.

| Ruta | Sección |
|------|---------|
| `/crochet/pedidos` | Pedidos (filtros: activos, por cobrar, estado) |
| `/crochet/productos` | **Hechos** — inventario de lo que ya tejiste |
| `/crochet/clientes` | Clientes |
| `/crochet/finanzas` | Vista negocio |
| `/crochet/materiales` | Hilos / materiales |

### Pedidos

- Qué es, cliente, precio, fecha de entrega, estado.
- **Ya cobrado** solo sube con **Registrar pago** (elige cuenta + SINPE/efectivo/transferencia). Así la plata sí aparece en Cuentas.
- Filtros: Activos · Por cobrar · En proceso · Listo · Entregado · Todos.

### Hechos

- Agregar lo que terminaste (+1, editar nombre/precio/nota).
- **Registrar venta** → baja stock y crea ingreso crochet en la cuenta que elijas.

---

## Cómo usarla día a día

1. En **Cuentas**, pon cuánto tienes ahora (aunque sea ₡0).
2. Cada gasto: **Sumar → Gasté**.
3. Cuando te paguen / entre la beca: **Me entró** (o atajo de beca).
4. Encargos: **Crochet → Pedidos**; al cobrar, **Registrar pago**.
5. Tejidos listos: **Hechos**; al vender, **Registrar venta**.
6. Fin de mes: mira Inicio / Gastos con el navegador de mes; ajusta Presupuesto si quieres.

---

## Datos y almacenamiento

- **Modo actual:** local-first. Todo en `.data/store.json`.
- Sin login ni servidor de auth obligatorio.
- **Ajustes:** exportar CSV, reiniciar / volver a sembrar datos, ingreso mensual esperado (para el atajo de beca).
- No subas `.data/` ni secretos al repo (`.gitignore` ya los excluye).

### Supabase (opcional, futuro)

Hay schema en `supabase/migrations/` y helpers de cliente. Hoy la app no depende de Supabase para funcionar.

Si más adelante quieres Auth en la nube:

1. Copia `.env.example` → `.env.local` y pon URL + anon key.
2. Aplica la migración SQL en tu proyecto Supabase.
3. Habría que volver a cablear las actions al cliente remoto (hoy leen/escriben el store local).

---

## PWA

- Manifest + service worker en `public/`.
- **iPhone (Safari):** Compartir → Añadir a pantalla de inicio.
- **Escritorio:** menú “Instalar” del navegador.

---

## Estructura del proyecto

```
src/
  app/(app)/          # Páginas autenticadas / principales
    page.tsx          # Inicio
    movimientos/      # Gastos e ingresos
    cuentas/
    presupuesto/
    metas/
    crochet/          # Hub + pedidos, hechos, clientes…
    ajustes/
    reportes/
  components/         # UI por dominio (accounts, crochet, transactions…)
  lib/
    actions/          # Server actions (cuentas, txs, crochet, etc.)
    local-db.ts       # Lectura/escritura de .data/store.json
    finance.ts        # Saldos, flujos del mes, pedidos
    data.ts           # Queries al store
    constants.ts      # Nav, labels, categorías base
    types.ts
public/               # PWA, iconos
supabase/             # Migración SQL opcional
.data/                # Datos locales (no versionar)
```

---

## Conceptos importantes

| Concepto | Significado |
|----------|-------------|
| Saldo actual | Lo que pones en Cuentas; luego se mueve con gastos/ingresos |
| SINPE | Cómo pagaste / te pagaron, no una billetera aparte |
| Registrar pago (pedido) | Única forma de que el cobro crochet sume en la cuenta |
| Registrar venta (hecho) | Venta de inventario + ingreso en cuenta |
| Etiqueta personal / crochet | Separa vida diaria del negocio en reportes y filtros |

---

## Seguridad y límites

- Pensada para uso personal en tu máquina (o un deploy privado).
- No hay conexión bancaria ni SINPE automática.
- No inventa saldos ni deudas.
- Si usas Supabase más adelante: RLS por `user_id`; nunca subas `.env.local`.

---

## Licencia / uso

Proyecto personal. Úsalo, adáptalo y cuida tu plata con calma.
