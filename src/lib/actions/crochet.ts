"use server";

import { revalidatePath } from "next/cache";
import { LOCAL_USER_ID, newId, readStore, writeStore } from "@/lib/local-db";
import type { OrderStatus, PaymentMethod } from "@/lib/types";

function revalidateCrochet() {
  revalidatePath("/crochet");
  revalidatePath("/crochet/pedidos");
  revalidatePath("/crochet/clientes");
  revalidatePath("/crochet/productos");
  revalidatePath("/crochet/materiales");
  revalidatePath("/crochet/finanzas");
  revalidatePath("/");
  revalidatePath("/movimientos");
}

export async function upsertCustomer(input: {
  id?: string;
  name: string;
  contact?: string | null;
  notes?: string | null;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  if (input.id) {
    const row = store.crochet_customers.find((c) => c.id === input.id);
    if (!row) return { error: "Cliente no encontrado" };
    Object.assign(row, {
      name: input.name.trim(),
      contact: input.contact || null,
      notes: input.notes || null,
      updated_at: now,
    });
  } else {
    store.crochet_customers.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      name: input.name.trim(),
      contact: input.contact || null,
      notes: input.notes || null,
      created_at: now,
      updated_at: now,
    });
  }
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function deleteCustomer(id: string) {
  const store = await readStore();
  store.crochet_customers = store.crochet_customers.filter((c) => c.id !== id);
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function upsertProduct(input: {
  id?: string;
  name: string;
  suggested_price?: number | null;
  estimated_hours?: number | null;
  materials_cost_estimate: number;
  stock: number;
  sold_count?: number;
  is_custom_base?: boolean;
  notes?: string | null;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const payload = {
    name: input.name.trim(),
    suggested_price: input.suggested_price
      ? Math.round(input.suggested_price)
      : null,
    estimated_hours: input.estimated_hours ?? null,
    materials_cost_estimate: Math.round(input.materials_cost_estimate || 0),
    stock: Math.max(0, Math.round(input.stock || 0)),
    is_custom_base: Boolean(input.is_custom_base),
    notes: input.notes || null,
    updated_at: now,
  };
  if (input.id) {
    const row = store.crochet_products.find((p) => p.id === input.id);
    if (!row) return { error: "Producto no encontrado" };
    Object.assign(row, payload);
    if (input.sold_count !== undefined) {
      row.sold_count = Math.max(0, Math.round(input.sold_count));
    } else if (row.sold_count === undefined) {
      row.sold_count = 0;
    }
  } else {
    store.crochet_products.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      photo_url: null,
      ...payload,
      sold_count: Math.max(0, Math.round(input.sold_count || 0)),
      created_at: now,
    });
  }
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

/** Marca que vendiste uno (o desmarca devolviendo uno a listos). */
export async function markProductSold(id: string, sold: boolean) {
  const store = await readStore();
  const row = store.crochet_products.find((p) => p.id === id);
  if (!row) return { error: "Producto no encontrado" };

  if (row.sold_count === undefined) row.sold_count = 0;

  if (sold) {
    if (row.stock <= 0) return { error: "Ya no tienes listos de este" };
    row.stock -= 1;
    row.sold_count += 1;
  } else {
    if (row.sold_count <= 0) return { error: "No hay ventas para desmarcar" };
    row.sold_count -= 1;
    row.stock += 1;
  }
  row.updated_at = new Date().toISOString();
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

/** Vende hechos y registra el ingreso en una cuenta. */
export async function sellProduct(input: {
  product_id: string;
  quantity: number;
  amount: number;
  account_id: string;
  method?: PaymentMethod | null;
  date?: string;
  note?: string | null;
}) {
  const qty = Math.round(input.quantity || 0);
  const amount = Math.round(input.amount || 0);
  if (qty < 1) return { error: "Indica cuántos vendiste" };
  if (amount <= 0) return { error: "Indica cuánto te pagaron" };
  if (!input.account_id) return { error: "Elige a qué cuenta entró" };

  const store = await readStore();
  const product = store.crochet_products.find((p) => p.id === input.product_id);
  if (!product) return { error: "Producto no encontrado" };
  if (product.sold_count === undefined) product.sold_count = 0;
  if (product.stock < qty) {
    return { error: `Solo tienes ${product.stock} listo(s)` };
  }

  const now = new Date().toISOString();
  const date = input.date || now.slice(0, 10);
  const category = store.categories.find((c) => c.name === "Ventas");

  product.stock -= qty;
  product.sold_count += qty;
  product.updated_at = now;

  store.transactions.unshift({
    id: newId(),
    user_id: LOCAL_USER_ID,
    date,
    type: "crochet_income",
    amount,
    account_id: input.account_id,
    category_id: category?.id ?? null,
    to_account_id: null,
    goal_id: null,
    description:
      input.note?.trim() ||
      `Venta: ${product.name}${qty > 1 ? ` ×${qty}` : ""}`,
    receipt_url: null,
    payment_method: input.method || null,
    tag: "crochet",
    status: "confirmed",
    crochet_order_id: null,
    created_at: now,
    updated_at: now,
  });

  await writeStore(store);
  revalidateCrochet();
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const store = await readStore();
  store.crochet_products = store.crochet_products.filter((p) => p.id !== id);
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function upsertMaterial(input: {
  id?: string;
  name: string;
  type: string;
  color?: string | null;
  purchase_cost: number;
  quantity: number;
  unit: string;
  supplier?: string | null;
  min_level: number;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const payload = {
    name: input.name.trim(),
    type: input.type,
    color: input.color || null,
    purchase_cost: Math.round(input.purchase_cost || 0),
    quantity: input.quantity,
    unit: input.unit,
    supplier: input.supplier || null,
    min_level: input.min_level,
    updated_at: now,
  };
  if (input.id) {
    const row = store.crochet_materials.find((m) => m.id === input.id);
    if (!row) return { error: "Material no encontrado" };
    Object.assign(row, payload);
  } else {
    store.crochet_materials.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      notes: null,
      ...payload,
      created_at: now,
    });
  }
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function deleteMaterial(id: string) {
  const store = await readStore();
  store.crochet_materials = store.crochet_materials.filter((m) => m.id !== id);
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function upsertOrder(input: {
  id?: string;
  customer_id?: string | null;
  product_id?: string | null;
  description: string;
  requested_date?: string | null;
  delivery_date?: string | null;
  agreed_price: number;
  advance_received: number;
  status: OrderStatus;
  payment_method?: PaymentMethod | null;
  materials_cost: number;
  packaging_cost: number;
  shipping_cost: number;
  other_costs: number;
  notes?: string | null;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const payload = {
    customer_id: input.customer_id || null,
    product_id: input.product_id || null,
    description: input.description.trim(),
    requested_date: input.requested_date || null,
    delivery_date: input.delivery_date || null,
    agreed_price: Math.round(input.agreed_price || 0),
    advance_received: Math.round(input.advance_received || 0),
    status: input.status,
    payment_method: input.payment_method || null,
    materials_cost: Math.round(input.materials_cost || 0),
    packaging_cost: Math.round(input.packaging_cost || 0),
    shipping_cost: Math.round(input.shipping_cost || 0),
    other_costs: Math.round(input.other_costs || 0),
    notes: input.notes || null,
    updated_at: now,
  };

  if (input.id) {
    const row = store.crochet_orders.find((o) => o.id === input.id);
    if (!row) return { error: "Pedido no encontrado" };
    Object.assign(row, payload);
  } else {
    store.crochet_orders.unshift({
      id: newId(),
      user_id: LOCAL_USER_ID,
      photo_url: null,
      ...payload,
      created_at: now,
    });
  }
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function deleteOrder(id: string) {
  const store = await readStore();
  store.crochet_orders = store.crochet_orders.filter((o) => o.id !== id);
  store.crochet_order_payments = store.crochet_order_payments.filter(
    (p) => p.order_id !== id
  );
  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function registerOrderPayment(input: {
  order_id: string;
  amount: number;
  date: string;
  method?: PaymentMethod | null;
  account_id: string;
  note?: string | null;
}) {
  const store = await readStore();
  const order = store.crochet_orders.find((o) => o.id === input.order_id);
  if (!order) return { error: "Pedido no encontrado" };

  const now = new Date().toISOString();
  const category = store.categories.find((c) => c.name === "Ventas");
  const txId = newId();

  store.transactions.unshift({
    id: txId,
    user_id: LOCAL_USER_ID,
    date: input.date,
    type: "crochet_income",
    amount: Math.round(input.amount),
    account_id: input.account_id,
    category_id: category?.id ?? null,
    to_account_id: null,
    goal_id: null,
    description: input.note || `Pago pedido: ${order.description}`,
    receipt_url: null,
    payment_method: input.method || null,
    tag: "crochet",
    status: "confirmed",
    crochet_order_id: order.id,
    created_at: now,
    updated_at: now,
  });

  const payAmount = Math.round(input.amount);

  store.crochet_order_payments.push({
    id: newId(),
    user_id: LOCAL_USER_ID,
    order_id: order.id,
    amount: payAmount,
    date: input.date,
    method: input.method || null,
    transaction_id: txId,
    note: input.note || null,
    created_at: now,
  });

  // No pasar del precio acordado si ya estaba marcado como cobrado en el pedido
  const room = Math.max(0, order.agreed_price - order.advance_received);
  order.advance_received += Math.min(payAmount, room);
  order.updated_at = now;

  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}

export async function transferCrochetProfit(input: {
  amount: number;
  from_account_id: string;
  to_account_id: string;
  date: string;
  description?: string;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  store.transactions.unshift({
    id: newId(),
    user_id: LOCAL_USER_ID,
    date: input.date,
    type: "transfer",
    amount: Math.round(input.amount),
    account_id: input.from_account_id,
    to_account_id: input.to_account_id,
    category_id: null,
    goal_id: null,
    description:
      input.description || "Transferencia de ganancias crochet → personal",
    receipt_url: null,
    payment_method: null,
    tag: "personal",
    status: "confirmed",
    crochet_order_id: null,
    created_at: now,
    updated_at: now,
  });
  await writeStore(store);
  revalidateCrochet();
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  return { ok: true };
}

export async function addBusinessExpense(input: {
  date: string;
  category: "Materiales" | "Empaques" | "Envíos" | "Herramientas" | "Otros";
  amount: number;
  description?: string | null;
  account_id: string;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const cat = store.categories.find((c) => c.name === input.category);
  const txId = newId();

  store.transactions.unshift({
    id: txId,
    user_id: LOCAL_USER_ID,
    date: input.date,
    type: "crochet_expense",
    amount: Math.round(input.amount),
    account_id: input.account_id,
    category_id: cat?.id ?? null,
    to_account_id: null,
    goal_id: null,
    description: input.description || `Gasto crochet: ${input.category}`,
    receipt_url: null,
    payment_method: null,
    tag: "crochet",
    status: "confirmed",
    crochet_order_id: null,
    created_at: now,
    updated_at: now,
  });

  store.crochet_business_expenses.push({
    id: newId(),
    user_id: LOCAL_USER_ID,
    date: input.date,
    category: input.category,
    amount: Math.round(input.amount),
    description: input.description || null,
    account_id: input.account_id,
    transaction_id: txId,
    created_at: now,
  });

  await writeStore(store);
  revalidateCrochet();
  return { ok: true };
}
