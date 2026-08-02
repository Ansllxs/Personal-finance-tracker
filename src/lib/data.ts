import {
  enrichAccounts,
  enrichCreditCards,
} from "@/lib/finance";
import { ensureSeeded, newId, readStore, writeStore } from "@/lib/local-db";
import type {
  Account,
  Budget,
  BudgetItem,
  Category,
  CreditCard,
  CrochetCustomer,
  CrochetMaterial,
  CrochetOrder,
  CrochetProduct,
  Goal,
  Profile,
  Transaction,
  WishlistItem,
} from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  const store = await ensureSeeded();
  return store.profile;
}

export async function getAccounts(): Promise<Account[]> {
  const store = await ensureSeeded();
  return store.accounts.filter((a) => a.is_active);
}

export async function getCategories(): Promise<Category[]> {
  const store = await ensureSeeded();
  return [...store.categories].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function getTransactions(limit?: number): Promise<Transaction[]> {
  const store = await ensureSeeded();
  const categories = new Map(store.categories.map((c) => [c.id, c]));
  const accounts = new Map(store.accounts.map((a) => [a.id, a]));

  const rows = [...store.transactions]
    .sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, limit ?? store.transactions.length)
    .map((tx) => ({
      ...tx,
      category: tx.category_id ? categories.get(tx.category_id) ?? null : null,
      account: tx.account_id ? accounts.get(tx.account_id) ?? null : null,
      to_account: tx.to_account_id
        ? accounts.get(tx.to_account_id) ?? null
        : null,
    }));

  return rows;
}

export async function getGoals(): Promise<Goal[]> {
  const store = await ensureSeeded();
  return store.goals;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const store = await ensureSeeded();
  return [...store.wishlist_items].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export async function getCreditCards(): Promise<CreditCard[]> {
  const store = await ensureSeeded();
  return store.credit_cards;
}

export async function getBudget(month: number, year: number) {
  const store = await ensureSeeded();
  let budget =
    store.budgets.find((b) => b.month === month && b.year === year) ?? null;

  if (!budget) {
    const now = new Date().toISOString();
    budget = {
      id: newId(),
      user_id: store.profile.id,
      month,
      year,
      expected_income: store.profile.monthly_income_expected,
      notes: null,
      created_at: now,
      updated_at: now,
    };
    store.budgets.push(budget);
    await writeStore(store);
  }

  const categories = new Map(store.categories.map((c) => [c.id, c]));
  const items = store.budget_items
    .filter((i) => i.budget_id === budget!.id)
    .map((i) => ({
      ...i,
      category: categories.get(i.category_id) ?? null,
    })) as BudgetItem[];

  return { budget: budget as Budget, items };
}

export async function getCrochetOrders(): Promise<CrochetOrder[]> {
  const store = await ensureSeeded();
  const customers = new Map(store.crochet_customers.map((c) => [c.id, c]));
  const products = new Map(store.crochet_products.map((p) => [p.id, p]));

  return [...store.crochet_orders]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((o) => ({
      ...o,
      customer: o.customer_id ? customers.get(o.customer_id) ?? null : null,
      product: o.product_id ? products.get(o.product_id) ?? null : null,
    }));
}

export async function getCrochetCustomers(): Promise<CrochetCustomer[]> {
  const store = await ensureSeeded();
  return [...store.crochet_customers].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );
}

export async function getCrochetProducts(): Promise<CrochetProduct[]> {
  const store = await ensureSeeded();
  return [...store.crochet_products].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );
}

export async function getCrochetMaterials(): Promise<CrochetMaterial[]> {
  const store = await ensureSeeded();
  return [...store.crochet_materials].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );
}

export async function getDashboardData() {
  await ensureSeeded();
  const [
    profile,
    accounts,
    categories,
    transactions,
    goals,
    creditCards,
    orders,
  ] = await Promise.all([
    getProfile(),
    getAccounts(),
    getCategories(),
    getTransactions(200),
    getGoals(),
    getCreditCards(),
    getCrochetOrders(),
  ]);

  const accountsWithBalance = enrichAccounts(accounts, transactions);
  const cards = enrichCreditCards(creditCards, accounts, transactions);

  return {
    profile,
    accounts: accountsWithBalance,
    categories,
    transactions,
    goals,
    cards,
    orders,
  };
}

/** Compat: ya no hay sesión Supabase */
export async function getSessionUser() {
  const store = await readStore();
  return { user: { id: store.profile.id }, supabase: null };
}
