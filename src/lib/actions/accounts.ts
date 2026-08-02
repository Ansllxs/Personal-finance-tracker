"use server";

import { revalidatePath } from "next/cache";
import {
  computeCardDebt,
  initialBalanceForDesired,
} from "@/lib/finance";
import { LOCAL_USER_ID, newId, readStore, writeStore } from "@/lib/local-db";
import type { AccountType } from "@/lib/types";

function revalidateAccounts() {
  revalidatePath("/cuentas");
  revalidatePath("/");
  revalidatePath("/movimientos");
}

export async function upsertAccount(input: {
  id?: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
  icon: string;
  notes?: string | null;
  configureBalance?: boolean;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const notes =
    input.configureBalance === false
      ? "__unconfigured__"
      : input.notes === "__unconfigured__"
        ? null
        : (input.notes ?? null);

  if (input.id) {
    const idx = store.accounts.findIndex((a) => a.id === input.id);
    if (idx === -1) return { error: "Cuenta no encontrada" };
    store.accounts[idx] = {
      ...store.accounts[idx],
      name: input.name.trim(),
      type: input.type,
      initial_balance: Math.round(input.initial_balance || 0),
      color: input.color,
      icon: input.icon,
      notes,
      updated_at: now,
    };
  } else {
    const id = newId();
    store.accounts.push({
      id,
      user_id: LOCAL_USER_ID,
      name: input.name.trim(),
      type: input.type,
      initial_balance: Math.round(input.initial_balance || 0),
      color: input.color,
      icon: input.icon,
      is_active: true,
      notes,
      created_at: now,
      updated_at: now,
    });
    if (input.type === "credit_card") {
      store.credit_cards.push({
        id: newId(),
        user_id: LOCAL_USER_ID,
        account_id: id,
        credit_limit: null,
        statement_day: null,
        payment_due_day: null,
        minimum_payment: null,
        interest_rate: null,
        notes: null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  await writeStore(store);
  revalidateAccounts();
  return { ok: true };
}

/** Pone el saldo actual real; recalcula el inicial para no romper movimientos. */
export async function setCurrentBalance(
  accountId: string,
  currentBalance: number
) {
  const store = await readStore();
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account) return { error: "Cuenta no encontrada" };

  account.initial_balance = initialBalanceForDesired(
    account,
    store.transactions,
    currentBalance
  );
  account.notes = null;
  account.updated_at = new Date().toISOString();
  await writeStore(store);
  revalidateAccounts();
  return { ok: true };
}

export async function configureAccountBalance(
  accountId: string,
  initialBalance: number
) {
  return setCurrentBalance(accountId, initialBalance);
}

export async function upsertCreditCard(input: {
  id: string;
  credit_limit: number | null;
  statement_day: number | null;
  payment_due_day: number | null;
  minimum_payment: number | null;
  interest_rate: number | null;
  notes?: string | null;
  current_debt?: number | null;
  account_id: string;
}) {
  const store = await readStore();
  const card = store.credit_cards.find((c) => c.id === input.id);
  if (!card) return { error: "Tarjeta no encontrada" };

  Object.assign(card, {
    credit_limit: input.credit_limit,
    statement_day: input.statement_day,
    payment_due_day: input.payment_due_day,
    minimum_payment: input.minimum_payment,
    interest_rate: input.interest_rate,
    notes: input.notes ?? card.notes,
    updated_at: new Date().toISOString(),
  });

  if (input.current_debt !== null && input.current_debt !== undefined) {
    const account = store.accounts.find((a) => a.id === input.account_id);
    if (account) {
      const desired = Math.round(input.current_debt);
      const debt = computeCardDebt(account, store.transactions);
      const net = debt - account.initial_balance;
      account.initial_balance = desired - net;
      account.notes = null;
      account.updated_at = new Date().toISOString();
    }
  }

  await writeStore(store);
  revalidateAccounts();
  return { ok: true };
}

export async function deleteAccount(id: string) {
  const store = await readStore();
  const linked = store.transactions.some(
    (t) => t.account_id === id || t.to_account_id === id
  );
  if (linked) {
    return {
      error:
        "Esta cuenta tiene movimientos. Muévelos o bórralos antes de eliminar la cuenta.",
    };
  }
  store.accounts = store.accounts.filter((a) => a.id !== id);
  store.credit_cards = store.credit_cards.filter((c) => c.account_id !== id);
  await writeStore(store);
  revalidateAccounts();
  return { ok: true };
}
