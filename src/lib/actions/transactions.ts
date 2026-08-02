"use server";

import { revalidatePath } from "next/cache";
import { LOCAL_USER_ID, newId, readStore, writeStore } from "@/lib/local-db";
import type {
  PaymentMethod,
  TransactionStatus,
  TransactionTag,
  TransactionType,
} from "@/lib/types";

export type TransactionInput = {
  id?: string;
  date: string;
  type: TransactionType;
  amount: number;
  category_id?: string | null;
  account_id?: string | null;
  to_account_id?: string | null;
  goal_id?: string | null;
  description?: string | null;
  payment_method?: PaymentMethod | null;
  tag: TransactionTag;
  status: TransactionStatus;
  crochet_order_id?: string | null;
};

function validateTx(input: TransactionInput): string | null {
  if (!input.date) return "La fecha es obligatoria.";
  if (!input.amount || input.amount <= 0) return "El monto debe ser mayor a 0.";
  if (input.type === "transfer" && (!input.account_id || !input.to_account_id)) {
    return "Una transferencia necesita cuenta origen y destino.";
  }
  if (input.type === "transfer" && input.account_id === input.to_account_id) {
    return "Origen y destino deben ser distintas.";
  }
  if (input.type === "card_payment" && (!input.account_id || !input.to_account_id)) {
    return "Un pago de tarjeta necesita la cuenta que paga y la tarjeta.";
  }
  if (
    ["income", "expense", "crochet_income", "crochet_expense", "goal_contribution"].includes(
      input.type
    ) &&
    !input.account_id
  ) {
    return "Selecciona una cuenta.";
  }
  return null;
}

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/presupuesto");
  revalidatePath("/metas");
  revalidatePath("/reportes");
  revalidatePath("/crochet");
}

function recalculateGoalSaved(
  store: Awaited<ReturnType<typeof readStore>>,
  goalId: string
) {
  const saved = store.goal_contributions
    .filter((c) => c.goal_id === goalId)
    .reduce((sum, row) => sum + row.amount, 0);
  const goal = store.goals.find((g) => g.id === goalId);
  if (!goal) return;
  goal.saved_amount = saved;
  goal.is_completed = saved >= goal.target_amount;
  goal.updated_at = new Date().toISOString();
}

export async function upsertTransaction(input: TransactionInput) {
  const validation = validateTx(input);
  if (validation) return { error: validation };

  const store = await readStore();
  const now = new Date().toISOString();
  const payload = {
    user_id: LOCAL_USER_ID,
    date: input.date,
    type: input.type,
    amount: Math.round(input.amount),
    category_id: input.category_id || null,
    account_id: input.account_id || null,
    to_account_id: input.to_account_id || null,
    goal_id: input.goal_id || null,
    description: input.description || null,
    receipt_url: null as string | null,
    payment_method: input.payment_method || null,
    tag: input.tag,
    status: input.status,
    crochet_order_id: input.crochet_order_id || null,
    updated_at: now,
  };

  let txId = input.id;

  if (input.id) {
    const idx = store.transactions.findIndex((t) => t.id === input.id);
    if (idx === -1) return { error: "Movimiento no encontrado" };
    store.transactions[idx] = {
      ...store.transactions[idx],
      ...payload,
    };
    store.goal_contributions = store.goal_contributions.filter(
      (c) => c.transaction_id !== input.id
    );
  } else {
    txId = newId();
    store.transactions.unshift({
      id: txId,
      ...payload,
      created_at: now,
    });
  }

  if (input.type === "goal_contribution" && input.goal_id && txId) {
    store.goal_contributions.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      goal_id: input.goal_id,
      transaction_id: txId,
      amount: Math.round(input.amount),
      date: input.date,
      note: input.description || null,
      created_at: now,
    });
    recalculateGoalSaved(store, input.goal_id);
  } else if (input.goal_id) {
    recalculateGoalSaved(store, input.goal_id);
  }

  await writeStore(store);
  revalidateFinance();
  return { ok: true, id: txId };
}

export async function deleteTransaction(id: string) {
  const store = await readStore();
  const tx = store.transactions.find((t) => t.id === id);
  store.transactions = store.transactions.filter((t) => t.id !== id);
  store.goal_contributions = store.goal_contributions.filter(
    (c) => c.transaction_id !== id
  );
  if (tx?.goal_id) recalculateGoalSaved(store, tx.goal_id);
  await writeStore(store);
  revalidateFinance();
  return { ok: true };
}

export async function duplicateTransaction(id: string) {
  const store = await readStore();
  const tx = store.transactions.find((t) => t.id === id);
  if (!tx) return { error: "Movimiento no encontrado" };

  return upsertTransaction({
    date: tx.date,
    type: tx.type,
    amount: tx.amount,
    category_id: tx.category_id,
    account_id: tx.account_id,
    to_account_id: tx.to_account_id,
    goal_id: tx.goal_id,
    description: tx.description
      ? `${tx.description} (copia)`
      : "Copia",
    payment_method: tx.payment_method,
    tag: tx.tag,
    status: tx.status,
    crochet_order_id: tx.crochet_order_id,
  });
}
