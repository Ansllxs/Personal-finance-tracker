import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  CROCHET_CATEGORIES,
  EXPENSE_CATEGORIES,
  SAMPLE_GOALS,
  SAMPLE_PRODUCTS,
} from "@/lib/constants";
import type {
  Account,
  Budget,
  BudgetItem,
  Category,
  CreditCard,
  CrochetBusinessExpense,
  CrochetCustomer,
  CrochetMaterial,
  CrochetOrder,
  CrochetOrderPayment,
  CrochetProduct,
  Goal,
  GoalContribution,
  Profile,
  Transaction,
  WishlistItem,
} from "@/lib/types";

export const LOCAL_USER_ID = "local-user";

export type LocalStore = {
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  credit_cards: CreditCard[];
  transactions: Transaction[];
  budgets: Budget[];
  budget_items: BudgetItem[];
  goals: Goal[];
  goal_contributions: GoalContribution[];
  wishlist_items: WishlistItem[];
  crochet_customers: CrochetCustomer[];
  crochet_products: CrochetProduct[];
  crochet_materials: CrochetMaterial[];
  crochet_orders: CrochetOrder[];
  crochet_order_payments: CrochetOrderPayment[];
  crochet_business_expenses: CrochetBusinessExpense[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function nowIso() {
  return new Date().toISOString();
}

function emptyStore(): LocalStore {
  const now = nowIso();
  return {
    profile: {
      id: LOCAL_USER_ID,
      display_name: "Angie",
      email: null,
      avatar_url: null,
      currency: "CRC",
      theme: "light",
      onboarding_completed: false,
      monthly_income_expected: 0,
      created_at: now,
      updated_at: now,
    },
    accounts: [],
    categories: [],
    credit_cards: [],
    transactions: [],
    budgets: [],
    budget_items: [],
    goals: [],
    goal_contributions: [],
    wishlist_items: [],
    crochet_customers: [],
    crochet_products: [],
    crochet_materials: [],
    crochet_orders: [],
    crochet_order_payments: [],
    crochet_business_expenses: [],
  };
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/** SINPE no es cuenta: se fusiona con el banco. */
function migrateSinpeIntoBank(store: LocalStore): boolean {
  let changed = false;
  const sinpeLike = store.accounts.filter(
    (a) => (a.type as string) === "sinpe" || a.name.trim().toLowerCase() === "sinpe"
  );
  for (const p of store.crochet_products) {
    if (p.sold_count === undefined || p.sold_count === null) {
      p.sold_count = 0;
      changed = true;
    }
  }

  if (sinpeLike.length === 0) {
    for (const tx of store.transactions) {
      if (!("payment_method" in tx) || tx.payment_method === undefined) {
        (tx as Transaction).payment_method = null;
        changed = true;
      }
    }
    return changed;
  }

  let bank = store.accounts.find((a) => a.type === "bank");
  if (!bank) {
    const first = sinpeLike[0];
    first.type = "bank";
    if (first.name.trim().toLowerCase() === "sinpe") {
      first.name = "Cuenta bancaria";
    }
    bank = first;
    changed = true;
  }

  for (const sinpe of sinpeLike) {
    if (sinpe.id === bank.id) continue;
    for (const tx of store.transactions) {
      if (tx.account_id === sinpe.id) {
        tx.account_id = bank.id;
        changed = true;
      }
      if (tx.to_account_id === sinpe.id) {
        tx.to_account_id = bank.id;
        changed = true;
      }
    }
    if (sinpe.notes !== "__unconfigured__") {
      bank.initial_balance += sinpe.initial_balance;
      if (bank.notes === "__unconfigured__") bank.notes = null;
    }
    store.accounts = store.accounts.filter((a) => a.id !== sinpe.id);
    changed = true;
  }

  for (const a of store.accounts) {
    if ((a.type as string) === "sinpe") {
      a.type = "bank";
      if (a.name.trim().toLowerCase() === "sinpe") a.name = "Cuenta bancaria";
      changed = true;
    }
  }

  for (const tx of store.transactions) {
    if (!("payment_method" in tx) || tx.payment_method === undefined) {
      (tx as Transaction).payment_method = null;
      changed = true;
    }
  }

  return changed;
}

export async function readStore(): Promise<LocalStore> {
  await ensureDir();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const store = { ...emptyStore(), ...JSON.parse(raw) } as LocalStore;
    if (migrateSinpeIntoBank(store)) {
      await writeStore(store);
    }
    return store;
  } catch {
    const store = emptyStore();
    await writeStore(store);
    return store;
  }
}

export async function writeStore(store: LocalStore) {
  await ensureDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function updateStore(
  updater: (store: LocalStore) => void | LocalStore
) {
  const store = await readStore();
  const result = updater(store);
  const next = result ?? store;
  await writeStore(next);
  return next;
}

export function newId() {
  return randomUUID();
}

/** Si no hay datos, siembra el ejemplo realista */
export async function ensureSeeded() {
  const store = await readStore();
  if (store.accounts.length > 0 || store.categories.length > 0) {
    return store;
  }
  return seedStore(store);
}

export async function seedStore(existing?: LocalStore) {
  const store = existing ?? emptyStore();
  const now = nowIso();
  const date = new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const uid = LOCAL_USER_ID;

  const bankId = newId();
  const cashId = newId();
  const cardId = newId();

  store.accounts = [
    {
      id: bankId,
      user_id: uid,
      name: "Cuenta bancaria",
      type: "bank",
      initial_balance: 0,
      color: "#D4A5A5",
      icon: "landmark",
      is_active: true,
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: cashId,
      user_id: uid,
      name: "Efectivo",
      type: "cash",
      initial_balance: 0,
      color: "#C5D1C0",
      icon: "banknote",
      is_active: true,
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: cardId,
      user_id: uid,
      name: "Tarjeta de crédito",
      type: "credit_card",
      initial_balance: 0,
      color: "#C5B0D0",
      icon: "credit-card",
      is_active: true,
      notes: null,
      created_at: now,
      updated_at: now,
    },
  ];

  store.credit_cards = [
    {
      id: newId(),
      user_id: uid,
      account_id: cardId,
      credit_limit: null,
      statement_day: null,
      payment_due_day: null,
      minimum_payment: null,
      interest_rate: null,
      notes: "Completa el límite, fechas y deuda actual cuando quieras.",
      created_at: now,
      updated_at: now,
    },
  ];

  const becaId = newId();
  store.categories = [
    {
      id: becaId,
      user_id: uid,
      name: "Beca U",
      type: "income",
      scope: "personal",
      color: "#A8B5A2",
      icon: "graduation-cap",
      is_system: true,
      created_at: now,
    },
    ...EXPENSE_CATEGORIES.map((c) => ({
      id: newId(),
      user_id: uid,
      name: c.name,
      type: "expense" as const,
      scope: "personal" as const,
      color: c.color,
      icon: c.icon,
      is_system: true,
      created_at: now,
    })),
    ...CROCHET_CATEGORIES.map((c) => ({
      id: newId(),
      user_id: uid,
      name: c.name,
      type: "crochet" as const,
      scope: "crochet" as const,
      color: c.color,
      icon: c.icon,
      is_system: true,
      created_at: now,
    })),
  ];

  // Sin movimientos ni montos fijos: tú pones cuánto tienes y lo que entra/sale
  store.transactions = [];

  const budgetId = newId();
  store.budgets = [
    {
      id: budgetId,
      user_id: uid,
      month,
      year,
      expected_income: 0,
      notes: null,
      created_at: now,
      updated_at: now,
    },
  ];

  store.budget_items = store.categories
    .filter((c) => c.type === "expense" && c.scope === "personal")
    .map((c) => ({
      id: newId(),
      user_id: uid,
      budget_id: budgetId,
      category_id: c.id,
      allocated_amount: 0,
      created_at: now,
    }));

  store.goals = SAMPLE_GOALS.map((g) => ({
    id: newId(),
    user_id: uid,
    name: g.name,
    image_url: null,
    target_amount: g.target_amount,
    saved_amount: 0,
    target_date: null,
    account_id: null,
    is_completed: false,
    created_at: now,
    updated_at: now,
  }));

  store.wishlist_items = [
    {
      id: newId(),
      user_id: uid,
      name: "Set de ganchillos ergonómicos",
      image_url: null,
      estimated_price: 12_000,
      link: null,
      priority: "medium",
      status: "want",
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      user_id: uid,
      name: "Cámara polaroid",
      image_url: null,
      estimated_price: 45_000,
      link: null,
      priority: "low",
      status: "want",
      notes: null,
      created_at: now,
      updated_at: now,
    },
  ];

  store.crochet_products = SAMPLE_PRODUCTS.map((p) => ({
    id: newId(),
    user_id: uid,
    name: p.name,
    photo_url: null,
    suggested_price: p.suggested_price,
    estimated_hours: p.estimated_hours,
    materials_cost_estimate: p.materials_cost_estimate,
    stock: p.stock,
    sold_count: 0,
    is_custom_base: "is_custom_base" in p ? Boolean(p.is_custom_base) : false,
    notes: null,
    created_at: now,
    updated_at: now,
  }));

  store.crochet_materials = [
    {
      id: newId(),
      user_id: uid,
      name: "Hilo de algodón",
      type: "hilo",
      color: "Crema",
      purchase_cost: 2_500,
      quantity: 5,
      unit: "ovillo",
      supplier: null,
      min_level: 2,
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      user_id: uid,
      name: "Relleno sintético",
      type: "relleno",
      color: null,
      purchase_cost: 3_000,
      quantity: 1,
      unit: "bolsa",
      supplier: null,
      min_level: 1,
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      user_id: uid,
      name: "Ojos de seguridad 8mm",
      type: "ojos de seguridad",
      color: "Negro",
      purchase_cost: 1_500,
      quantity: 20,
      unit: "par",
      supplier: null,
      min_level: 5,
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: newId(),
      user_id: uid,
      name: "Bolsa de regalo kraft",
      type: "empaque",
      color: "Natural",
      purchase_cost: 200,
      quantity: 15,
      unit: "unidad",
      supplier: null,
      min_level: 5,
      notes: null,
      created_at: now,
      updated_at: now,
    },
  ];

  store.profile = {
    ...store.profile,
    onboarding_completed: true,
    monthly_income_expected: 0,
    updated_at: now,
  };

  store.crochet_customers = [];
  store.crochet_orders = [];
  store.crochet_order_payments = [];
  store.crochet_business_expenses = [];
  store.goal_contributions = [];

  await writeStore(store);
  return store;
}
