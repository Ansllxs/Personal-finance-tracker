# Finance Tracker

*Un rinconcito para cuidar tu plata… y tu crochet.*

Registro personal en **colones (₡)**, en español, solo para ti.  
Sin inventar saldos: tú dices cuánto tienes; la app solo cuenta lo que vas anotando.

Hecha con calma: rosa empolvado, crema, gingham suave y esa vibra scrapbook / coquette.  
Puedes usarla en el navegador o como **app de escritorio en Mac** — tus datos se guardan siempre en tu máquina.

> *Cuidar tu dinero también es cuidarte a ti.*

---

## Empezar (es fácil)

```bash
npm install
npm run dev
```

Luego abre [http://localhost:3000](http://localhost:3000)  
Entras directo — **sin login**, sin drama.

En el navegador, los datos viven en `.data/store.json` (no se suben a git).

| Comando | Para qué |
|---------|----------|
| `npm run dev` | Navegador en desarrollo |
| `npm run desktop` | **App de escritorio** (ventana propia) |
| `npm run desktop:prod` | Escritorio con build de producción |
| `npm run desktop:pack` | Generar `.dmg` / `.app` instalable |
| `npm run build` | Build web |
| `npm run lint` | Revisar el código |

---

## App de escritorio (Mac)

```bash
npm install
npm run desktop
```

Se abre una ventana de **Finance Tracker** (puede tardar un poco la primera vez).  
Cada cambio se guarda al instante en:

`~/Library/Application Support/Finance Tracker/data/store.json`

Si ya tenías datos en `.data/` del proyecto, la primera vez los **migra** solos a esa carpeta.

> Puedes tener el navegador (`npm run dev`) y el escritorio abiertos a la vez; usan carpetas distintas.

### Instalable (.dmg)

```bash
npm run desktop:pack
```

El instalador queda en `dist-desktop/`.  
(Puede pedir permisos de red la primera vez que Electron descarga binarios.)

---

## El menú, en corto

| Dónde | Qué encuentras |
|-------|----------------|
| **Inicio** | Tu disponible, el mes, metas, y el botón **Sumar** |
| **Gastos** | Todo lo que anotaste (con mes ← →) |
| **Cuentas** | Banco, efectivo, tarjeta — saldos reales |
| **Presupuesto** | Cómo quieres repartir el mes |
| **Metas** | Ahorros y wishlist con cariño |
| **Crochet** | Pedidos, hechos, clientes, ventas |
| **Más** | Ajustes, exportar, reportes, reiniciar |

---

## Tu plata del día a día

### El botón **Sumar**

Es tu atajo favorito:

- **Gasté** — cuánto, en qué, de qué cuenta, y cómo (SINPE / efectivo / transferencia)
- **Me entró** — lo mismo, pero al revés (incluye atajo *Entró la beca*)
- **Meta** — aportas a un sueño y **se rebaja** de la cuenta que elijas

### Cuentas (sin mentiras)

- Banco, efectivo, tarjeta, sobre de ahorro — todo editable
- **SINPE no es una cuenta aparte**: es *cómo* te mueven la plata; el dinero vive en el banco
- Toca **Editar / poner saldo** y escribe *¿cuánto tienes ahora?* (aunque sea cero)
- Cada cuenta te muestra qué entró y salió en el mes

### Presupuesto & metas

- Presupuesto: números tuyos, no plantillas rígidas
- Metas: desde Inicio o desde Metas — cada aporte baja de tu cuenta y sube a la meta

---

## El rinconcito crochet

En **Crochet** ves ventas del mes, pedidos activos, por cobrar y entregas de la semana.

| Rincón | Para qué |
|--------|----------|
| **Pedidos** | Encargos, filtros (activos, por cobrar…) |
| **Hechos** | Lo que ya tejiste y está listo |
| **Clientes** | Quién te pide |
| **Finanzas / Materiales** | Si quieres ir más a fondo |

**Tips de oro**

- Cuando te paguen un pedido → **Registrar pago** (así sí llega a tu cuenta)
- Cuando vendas un hecho → **Registrar venta** (baja del inventario y suma la plata)

---

## Una rutina suave

1. Pon tu saldo real en **Cuentas**
2. Gastaste algo → **Sumar → Gasté**
3. Entró la beca (o un pago) → **Me entró**
4. Quieres ahorrar → **Sumar → Meta**
5. Encargos → **Pedidos**; cobros → **Registrar pago**
6. Terminaste un tejido → **Hechos**; lo vendiste → **Registrar venta**
7. Fin de mes → mira Inicio / Gastos cambiando el mes

---

## Detrás del telón (poquito técnico)

**Stack:** Next.js 16 · TypeScript · Tailwind · Electron (escritorio) · Recharts · Lucide  
**Datos:** JSON local — en web `.data/`; en escritorio `~/Library/Application Support/Finance Tracker/data/`.

```
src/               → pantallas y lógica
electron/          → app de escritorio (ventana Mac)
scripts/           → prepare del empaquetado
public/            → PWA e iconitos
supabase/          → SQL opcional
.data/             → datos del modo navegador (no versionar)
dist-desktop/      → .dmg / .app al empaquetar
```

### PWA (app en el bolsillo)

- **iPhone:** Safari → Compartir → *Añadir a pantalla de inicio*
- **Mac:** el menú de “Instalar” del navegador

### Supabase (si algún día quieres nube)

Hay migración en `supabase/migrations/`. Hoy no hace falta.  
Si la usas: `.env.example` → `.env.local`, y nunca subas secretos.

---

## Cositas a tener claras

| Idea | En simple |
|------|-----------|
| Saldo actual | Lo que *tú* escribes; después se mueve solo |
| SINPE | Forma de pago, no billetera extra |
| Registrar pago | El cobro del pedido que sí mueve la cuenta |
| Registrar venta | Venta de un hecho + ingreso |
| Aporte a meta | Ahorro que se rebaja de la cuenta |

---

## Seguridad con cariño

- Pensada para ti, en tu compu (o un deploy privado)
- Sin banco automático ni SINPE mágica
- No inventa plata ni deudas
- `.data/` y `.env.local` se quedan en casa

---

Hecho con calma · ₡  

*Cuida cada colón… y disfruta cada puntada.*
