"use server";

import { revalidatePath } from "next/cache";
import { LOCAL_USER_ID, newId, readStore, writeStore } from "@/lib/local-db";
import { DEFAULT_MONTHLY_INCOME } from "@/lib/constants";

export async function saveBudgetItem(
  budgetId: string,
  categoryId: string,
  allocatedAmount: number
) {
  const store = await readStore();
  const existing = store.budget_items.find(
    (i) => i.budget_id === budgetId && i.category_id === categoryId
  );
  if (existing) {
    existing.allocated_amount = Math.round(allocatedAmount);
  } else {
    store.budget_items.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      budget_id: budgetId,
      category_id: categoryId,
      allocated_amount: Math.round(allocatedAmount),
      created_at: new Date().toISOString(),
    });
  }
  await writeStore(store);
  revalidatePath("/presupuesto");
  revalidatePath("/");
  return { ok: true };
}

export async function ensureBudget(month: number, year: number) {
  const store = await readStore();
  let budget = store.budgets.find((b) => b.month === month && b.year === year);
  if (budget) return { budget };

  const now = new Date().toISOString();
  budget = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    month,
    year,
    expected_income:
      store.profile.monthly_income_expected ?? DEFAULT_MONTHLY_INCOME,
    notes: null,
    created_at: now,
    updated_at: now,
  };
  store.budgets.push(budget);
  await writeStore(store);
  revalidatePath("/presupuesto");
  return { budget };
}

export async function copyBudgetToNextMonth(month: number, year: number) {
  const store = await readStore();
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const source = store.budgets.find((b) => b.month === month && b.year === year);
  if (!source) return { error: "No hay presupuesto este mes para copiar." };

  const sourceItems = store.budget_items.filter(
    (i) => i.budget_id === source.id
  );

  let dest = store.budgets.find(
    (b) => b.month === nextMonth && b.year === nextYear
  );
  const now = new Date().toISOString();

  if (!dest) {
    dest = {
      id: newId(),
      user_id: LOCAL_USER_ID,
      month: nextMonth,
      year: nextYear,
      expected_income: source.expected_income,
      notes: source.notes,
      created_at: now,
      updated_at: now,
    };
    store.budgets.push(dest);
  } else {
    dest.expected_income = source.expected_income;
    dest.updated_at = now;
  }

  store.budget_items = store.budget_items.filter((i) => i.budget_id !== dest!.id);
  for (const item of sourceItems) {
    store.budget_items.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      budget_id: dest.id,
      category_id: item.category_id,
      allocated_amount: item.allocated_amount,
      created_at: now,
    });
  }

  await writeStore(store);
  revalidatePath("/presupuesto");
  return { ok: true, month: nextMonth, year: nextYear };
}
