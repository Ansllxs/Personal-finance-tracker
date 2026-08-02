import type { OrderStatus, PaymentMethod, TransactionType } from "./types";

export const APP_NAME = "Finance Tracker";
export const DEFAULT_MONTHLY_INCOME = 295_000;

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  card_payment: "Pago de tarjeta",
  goal_contribution: "Aporte a meta",
  crochet_income: "Ingreso crochet",
  crochet_expense: "Gasto crochet",
};

export const ACCOUNT_TYPE_LABELS = {
  bank: "Cuenta bancaria",
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  savings_envelope: "Sobre de ahorro",
} as const;

/** Cómo se mueve la plata (no es una cuenta aparte) */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  sinpe: "SINPE",
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  consulta: "Consulta",
  confirmado: "Confirmado",
  en_proceso: "En proceso",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const WISHLIST_STATUS_LABELS = {
  want: "Quiero",
  saving: "Ahorrando",
  bought: "Comprado",
} as const;

export const PRIORITY_LABELS = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
} as const;

/** Navegación principal */
export const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: "Home" },
  { href: "/movimientos", label: "Gastos", icon: "ArrowLeftRight" },
  { href: "/cuentas", label: "Cuentas", icon: "Wallet" },
  { href: "/presupuesto", label: "Presupuesto", icon: "PieChart" },
  { href: "/metas", label: "Metas", icon: "Sparkles" },
  { href: "/crochet", label: "Crochet", icon: "Scissors" },
  { href: "/ajustes", label: "Más", icon: "Settings" },
] as const;

export const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: "Home" },
  { href: "/movimientos", label: "Gastos", icon: "ArrowLeftRight" },
  { href: "/presupuesto", label: "Presup.", icon: "PieChart" },
  { href: "/metas", label: "Metas", icon: "Sparkles" },
  { href: "/crochet", label: "Crochet", icon: "Scissors" },
  { href: "/cuentas", label: "Cuentas", icon: "Wallet" },
  { href: "/ajustes", label: "Más", icon: "Menu" },
] as const;

export const MONEY_QUOTES = [
  "Cuidar tu dinero también es cuidarte a ti.",
  "Cada colón tiene un propósito.",
  "El orden financiero da paz mental.",
  "Ahorrar es un acto de cariño hacia tu yo futuro.",
  "Pequeños pasos, mucha calma.",
  "Tu negocio de crochet merece números claros.",
  "Presupuestar no limita: da libertad.",
  "Hoy eliges con cariño dónde va cada colón.",
];

export const EXPENSE_CATEGORIES = [
  { name: "Mercado", color: "#C9A0A0", icon: "shopping-basket" },
  { name: "Uber/Transporte", color: "#B8C4D9", icon: "car" },
  { name: "Salidas", color: "#D4B5C9", icon: "coffee" },
  { name: "Gastos hormiga", color: "#E8C4B8", icon: "cookie" },
  { name: "Necesidades", color: "#A8B5A2", icon: "heart" },
  { name: "Estudios", color: "#9BB0C9", icon: "book" },
  { name: "Suscripciones", color: "#C5B0D0", icon: "repeat" },
  { name: "Salud", color: "#B5C9B8", icon: "heart-pulse" },
  { name: "Regalos", color: "#D4A5B5", icon: "gift" },
] as const;

export const CROCHET_CATEGORIES = [
  { name: "Materiales", color: "#C5D1C0", icon: "yarn" },
  { name: "Empaques", color: "#D4C4B0", icon: "package" },
  { name: "Envíos", color: "#B8C4D9", icon: "truck" },
  { name: "Ventas", color: "#D4A5A5", icon: "store" },
  { name: "Herramientas", color: "#C9B8A8", icon: "wrench" },
] as const;

export const SAMPLE_GOALS = [
  { name: "Viaje a Lisboa", target_amount: 800_000, color: "#D4A5A5" },
  { name: "iPad", target_amount: 450_000, color: "#B8C4D9" },
  { name: "Televisor", target_amount: 350_000, color: "#C5D1C0" },
] as const;

export const SAMPLE_PRODUCTS = [
  {
    name: "Amigurumi pequeño",
    suggested_price: 8_000,
    materials_cost_estimate: 2_500,
    estimated_hours: 4,
    stock: 2,
  },
  {
    name: "Flor tejida",
    suggested_price: 3_500,
    materials_cost_estimate: 800,
    estimated_hours: 1.5,
    stock: 5,
  },
  {
    name: "Llavero crochet",
    suggested_price: 2_500,
    materials_cost_estimate: 500,
    estimated_hours: 1,
    stock: 8,
  },
  {
    name: "Encargo personalizado",
    suggested_price: 15_000,
    materials_cost_estimate: 4_000,
    estimated_hours: 8,
    stock: 0,
    is_custom_base: true,
  },
] as const;

/** Sugerencia 50/30/20 no invasiva sobre ingreso esperado */
export function suggestedBudgetSplit(income: number) {
  return {
    needs: Math.round(income * 0.5),
    wants: Math.round(income * 0.3),
    savings: Math.round(income * 0.2),
  };
}
