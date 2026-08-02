import {
  CROCHET_CATEGORIES,
  EXPENSE_CATEGORIES,
  SAMPLE_GOALS,
  SAMPLE_PRODUCTS,
} from "./constants";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function seedUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  // Evitar reseeding si ya hay cuentas
  const { count } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) {
    return { ok: false, error: "Ya tienes datos. Borra primero si quieres reseeding." };
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Cuentas — saldos sin configurar (la usuaria los completa)
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .insert([
      {
        user_id: userId,
        name: "Cuenta bancaria",
        type: "bank",
        initial_balance: 0,
        color: "#D4A5A5",
        icon: "landmark",
        notes: null,
      },
      {
        user_id: userId,
        name: "Efectivo",
        type: "cash",
        initial_balance: 0,
        color: "#C5D1C0",
        icon: "banknote",
        notes: null,
      },
      {
        user_id: userId,
        name: "Tarjeta de crédito",
        type: "credit_card",
        initial_balance: 0,
        color: "#C5B0D0",
        icon: "credit-card",
        notes: null,
      },
    ])
    .select();

  if (accErr || !accounts) {
    return { ok: false, error: accErr?.message ?? "Error creando cuentas" };
  }

  const cardAccount = accounts.find((a) => a.type === "credit_card");
  if (cardAccount) {
    await supabase.from("credit_cards").insert({
      user_id: userId,
      account_id: cardAccount.id,
      credit_limit: null,
      statement_day: null,
      payment_due_day: null,
      minimum_payment: null,
      interest_rate: null,
      notes: "Completa el límite, fechas y deuda actual cuando quieras.",
    });
  }

  // Categorías
  const incomeCats = [
    {
      user_id: userId,
      name: "Beca U",
      type: "income" as const,
      scope: "personal" as const,
      color: "#A8B5A2",
      icon: "graduation-cap",
      is_system: true,
    },
  ];

  const expenseCats = EXPENSE_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: "expense" as const,
    scope: "personal" as const,
    color: c.color,
    icon: c.icon,
    is_system: true,
  }));

  const crochetCats = CROCHET_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: "crochet" as const,
    scope: "crochet" as const,
    color: c.color,
    icon: c.icon,
    is_system: true,
  }));

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .insert([...incomeCats, ...expenseCats, ...crochetCats])
    .select();

  if (catErr || !categories) {
    return { ok: false, error: catErr?.message ?? "Error creando categorías" };
  }

  // Presupuesto del mes vacío — tú defines los montos
  const { data: budget } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      month,
      year,
      expected_income: 0,
      notes: null,
    })
    .select()
    .single();

  if (budget) {
    const items = categories
      .filter((c) => c.type === "expense" && c.scope === "personal")
      .map((c) => ({
        user_id: userId,
        budget_id: budget.id,
        category_id: c.id,
        allocated_amount: 0,
      }));

    if (items.length) {
      await supabase.from("budget_items").insert(items);
    }
  }

  // Metas (monto ahorrado en 0 — la usuaria aporta)
  await supabase.from("goals").insert(
    SAMPLE_GOALS.map((g) => ({
      user_id: userId,
      name: g.name,
      target_amount: g.target_amount,
      saved_amount: 0,
      image_url: null,
      target_date: null,
    }))
  );

  // Wishlist de ejemplo
  await supabase.from("wishlist_items").insert([
    {
      user_id: userId,
      name: "Set de ganchillos ergonómicos",
      estimated_price: 12_000,
      priority: "medium",
      status: "want",
    },
    {
      user_id: userId,
      name: "Cámara polaroid",
      estimated_price: 45_000,
      priority: "low",
      status: "want",
    },
  ]);

  // Productos crochet
  await supabase.from("crochet_products").insert(
    SAMPLE_PRODUCTS.map((p) => ({
      user_id: userId,
      name: p.name,
      suggested_price: p.suggested_price,
      materials_cost_estimate: p.materials_cost_estimate,
      estimated_hours: p.estimated_hours,
      stock: p.stock,
      is_custom_base: "is_custom_base" in p ? Boolean(p.is_custom_base) : false,
    }))
  );

  // Materiales de ejemplo (cantidades, sin inventar proveedores reales)
  await supabase.from("crochet_materials").insert([
    {
      user_id: userId,
      name: "Hilo de algodón",
      type: "hilo",
      color: "Crema",
      purchase_cost: 2_500,
      quantity: 5,
      unit: "ovillo",
      min_level: 2,
    },
    {
      user_id: userId,
      name: "Relleno sintético",
      type: "relleno",
      color: null,
      purchase_cost: 3_000,
      quantity: 1,
      unit: "bolsa",
      min_level: 1,
    },
    {
      user_id: userId,
      name: "Ojos de seguridad 8mm",
      type: "ojos de seguridad",
      color: "Negro",
      purchase_cost: 1_500,
      quantity: 20,
      unit: "par",
      min_level: 5,
    },
    {
      user_id: userId,
      name: "Bolsa de regalo kraft",
      type: "empaque",
      color: "Natural",
      purchase_cost: 200,
      quantity: 15,
      unit: "unidad",
      min_level: 5,
    },
  ]);

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true, monthly_income_expected: 0 })
    .eq("id", userId);

  return { ok: true };
}
