"use server";

import { revalidatePath } from "next/cache";
import {
  LOCAL_USER_ID,
  newId,
  readStore,
  seedStore,
  writeStore,
} from "@/lib/local-db";
import type { TransactionType } from "@/lib/types";

async function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/presupuesto");
  revalidatePath("/cuentas");
  revalidatePath("/metas");
  revalidatePath("/crochet");
  revalidatePath("/ajustes");
  revalidatePath("/reportes");
}

export async function updateProfile(input: {
  display_name: string;
  theme: "light" | "dark" | "system";
  monthly_income_expected: number;
}) {
  const store = await readStore();
  store.profile.display_name = input.display_name.trim();
  store.profile.theme = input.theme;
  store.profile.monthly_income_expected = Math.round(
    input.monthly_income_expected
  );
  store.profile.updated_at = new Date().toISOString();
  await writeStore(store);
  revalidatePath("/ajustes");
  revalidatePath("/");
  return { ok: true };
}

export async function upsertCategory(input: {
  id?: string;
  name: string;
  type: "income" | "expense" | "transfer" | "crochet";
  scope: "personal" | "crochet" | "both";
  color: string;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  if (input.id) {
    const cat = store.categories.find((c) => c.id === input.id);
    if (!cat) return { error: "Categoría no encontrada" };
    Object.assign(cat, {
      name: input.name.trim(),
      type: input.type,
      scope: input.scope,
      color: input.color,
    });
  } else {
    store.categories.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      name: input.name.trim(),
      type: input.type,
      scope: input.scope,
      color: input.color,
      icon: "tag",
      is_system: false,
      created_at: now,
    });
  }
  await writeStore(store);
  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const store = await readStore();
  const exists = store.categories.some((c) => c.id === id);
  if (!exists) return { error: "Categoría no encontrada" };

  store.categories = store.categories.filter((c) => c.id !== id);
  store.budget_items = store.budget_items.filter((i) => i.category_id !== id);
  for (const tx of store.transactions) {
    if (tx.category_id === id) tx.category_id = null;
  }

  await writeStore(store);
  revalidatePath("/ajustes");
  revalidatePath("/presupuesto");
  revalidatePath("/movimientos");
  revalidatePath("/");
  return { ok: true };
}

export async function runSeed() {
  const store = await readStore();
  if (store.accounts.length > 0) {
    return {
      ok: false,
      error:
        "Ya tienes datos. Borra la carpeta .data si quieres empezar de cero.",
    };
  }
  await seedStore(store);
  await revalidateAll();
  return { ok: true };
}

export async function resetAndSeed() {
  await seedStore();
  await revalidateAll();
  return { ok: true };
}

export async function exportAllCsv(): Promise<
  { error: string } | { csv: string; filename: string }
> {
  const store = await readStore();
  const lines: string[] = [];
  lines.push("section,id,date,type,amount,description,extra");

  for (const a of store.accounts) {
    lines.push(
      ["account", a.id, "", a.type, a.initial_balance, csvEscape(a.name), a.notes ?? ""].join(",")
    );
  }
  for (const c of store.categories) {
    lines.push(
      ["category", c.id, "", c.type, "", csvEscape(c.name), c.scope].join(",")
    );
  }
  for (const t of store.transactions) {
    lines.push(
      [
        "transaction",
        t.id,
        t.date,
        t.type,
        t.amount,
        csvEscape(t.description ?? ""),
        t.tag,
      ].join(",")
    );
  }
  for (const g of store.goals) {
    lines.push(
      [
        "goal",
        g.id,
        g.target_date ?? "",
        "",
        g.target_amount,
        csvEscape(g.name),
        String(g.saved_amount),
      ].join(",")
    );
  }
  for (const o of store.crochet_orders) {
    lines.push(
      [
        "crochet_order",
        o.id,
        o.delivery_date ?? "",
        o.status,
        o.agreed_price,
        csvEscape(o.description),
        String(o.advance_received),
      ].join(",")
    );
  }

  return {
    csv: lines.join("\n"),
    filename: `finance-tracker-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function importTransactionsCsv(csvText: string) {
  const store = await readStore();
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { error: "El CSV está vacío o incompleto." };

  const header = lines[0].toLowerCase();
  if (!header.includes("date") || !header.includes("amount")) {
    return {
      error:
        "Formato esperado: date,type,amount,description,tag (type: income|expense|...)",
    };
  }

  const accountId = store.accounts.find((a) => a.type !== "credit_card")?.id;
  if (!accountId) {
    return { error: "Necesitas al menos una cuenta antes de importar." };
  }

  const now = new Date().toISOString();
  let count = 0;
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const parts = parseCsvLine(line);
    const [date, type, amountStr, description, tag] = parts;
    const amount = Number(amountStr);
    if (!date || !amount || amount <= 0) continue;
    store.transactions.unshift({
      id: newId(),
      user_id: LOCAL_USER_ID,
      date,
      type: (type || "expense") as TransactionType,
      amount: Math.round(amount),
      description: description || null,
      tag: tag === "crochet" ? "crochet" : "personal",
      status: "confirmed",
      account_id: accountId,
      category_id: null,
      to_account_id: null,
      goal_id: null,
      receipt_url: null,
      payment_method: null,
      crochet_order_id: null,
      created_at: now,
      updated_at: now,
    });
    count++;
  }

  if (!count) return { error: "No se encontraron filas válidas." };
  await writeStore(store);
  revalidatePath("/movimientos");
  revalidatePath("/");
  return { ok: true, count };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
