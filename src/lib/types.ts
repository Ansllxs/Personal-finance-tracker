export type AccountType =
  | "bank"
  | "cash"
  | "credit_card"
  | "savings_envelope";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "card_payment"
  | "goal_contribution"
  | "crochet_income"
  | "crochet_expense";

export type TransactionTag = "personal" | "crochet";
export type TransactionStatus = "confirmed" | "pending";
export type CategoryType = "income" | "expense" | "transfer" | "crochet";
export type CategoryScope = "personal" | "crochet" | "both";
export type WishlistPriority = "low" | "medium" | "high";
export type WishlistStatus = "want" | "saving" | "bought";
export type OrderStatus =
  | "consulta"
  | "confirmado"
  | "en_proceso"
  | "listo"
  | "entregado"
  | "cancelado";
export type PaymentMethod = "sinpe" | "efectivo" | "transferencia";

export interface Profile {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  currency: string;
  theme: "light" | "dark" | "system";
  onboarding_completed: boolean;
  monthly_income_expected: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  scope: CategoryScope;
  color: string;
  icon: string;
  is_system: boolean;
  created_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  account_id: string;
  credit_limit: number | null;
  statement_day: number | null;
  payment_due_day: number | null;
  minimum_payment: number | null;
  interest_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  to_account_id: string | null;
  goal_id: string | null;
  description: string | null;
  receipt_url: string | null;
  /** Cómo pagaste / te pagaron (SINPE, efectivo…). No es una cuenta. */
  payment_method: PaymentMethod | null;
  tag: TransactionTag;
  status: TransactionStatus;
  crochet_order_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  account?: Account | null;
  to_account?: Account | null;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  expected_income: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  user_id: string;
  budget_id: string;
  category_id: string;
  allocated_amount: number;
  created_at: string;
  category?: Category | null;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  account_id: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  transaction_id: string | null;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  estimated_price: number | null;
  link: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrochetCustomer {
  id: string;
  user_id: string;
  name: string;
  contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrochetProduct {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  suggested_price: number | null;
  estimated_hours: number | null;
  materials_cost_estimate: number;
  /** Cuántos tienes listos (sin vender) */
  stock: number;
  /** Cuántos ya vendiste de este hecho */
  sold_count: number;
  is_custom_base: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrochetMaterial {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string | null;
  purchase_cost: number;
  quantity: number;
  unit: string;
  supplier: string | null;
  min_level: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrochetOrder {
  id: string;
  user_id: string;
  customer_id: string | null;
  product_id: string | null;
  description: string;
  photo_url: string | null;
  requested_date: string | null;
  delivery_date: string | null;
  agreed_price: number;
  advance_received: number;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  materials_cost: number;
  packaging_cost: number;
  shipping_cost: number;
  other_costs: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: CrochetCustomer | null;
  product?: CrochetProduct | null;
}

export interface CrochetOrderPayment {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  date: string;
  method: PaymentMethod | null;
  transaction_id: string | null;
  note: string | null;
  created_at: string;
}

export interface CrochetBusinessExpense {
  id: string;
  user_id: string;
  date: string;
  category: "Materiales" | "Empaques" | "Envíos" | "Herramientas" | "Otros";
  amount: number;
  description: string | null;
  account_id: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface AccountWithBalance extends Account {
  balance: number;
  balanceConfigured: boolean;
}

export interface CreditCardSummary extends CreditCard {
  account?: Account | null;
  debt: number;
  available: number | null;
  debtConfigured: boolean;
}
