"use server";

import { revalidatePath } from "next/cache";
import { LOCAL_USER_ID, newId, readStore, writeStore } from "@/lib/local-db";
import type { WishlistPriority, WishlistStatus } from "@/lib/types";

export async function upsertGoal(input: {
  id?: string;
  name: string;
  target_amount: number;
  target_date?: string | null;
  account_id?: string | null;
  image_url?: string | null;
}) {
  const store = await readStore();
  const now = new Date().toISOString();

  if (input.id) {
    const goal = store.goals.find((g) => g.id === input.id);
    if (!goal) return { error: "Meta no encontrada" };
    Object.assign(goal, {
      name: input.name.trim(),
      target_amount: Math.round(input.target_amount),
      target_date: input.target_date || null,
      account_id: input.account_id || null,
      image_url: input.image_url || null,
      updated_at: now,
    });
  } else {
    store.goals.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      name: input.name.trim(),
      target_amount: Math.round(input.target_amount),
      saved_amount: 0,
      target_date: input.target_date || null,
      account_id: input.account_id || null,
      image_url: input.image_url || null,
      is_completed: false,
      created_at: now,
      updated_at: now,
    });
  }

  await writeStore(store);
  revalidatePath("/metas");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteGoal(id: string) {
  const store = await readStore();
  store.goals = store.goals.filter((g) => g.id !== id);
  store.goal_contributions = store.goal_contributions.filter(
    (c) => c.goal_id !== id
  );
  await writeStore(store);
  revalidatePath("/metas");
  return { ok: true };
}

export async function upsertWishlistItem(input: {
  id?: string;
  name: string;
  estimated_price?: number | null;
  link?: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  notes?: string | null;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const payload = {
    name: input.name.trim(),
    estimated_price: input.estimated_price
      ? Math.round(input.estimated_price)
      : null,
    link: input.link || null,
    priority: input.priority,
    status: input.status,
    notes: input.notes || null,
    updated_at: now,
  };

  if (input.id) {
    const item = store.wishlist_items.find((w) => w.id === input.id);
    if (!item) return { error: "Ítem no encontrado" };
    Object.assign(item, payload);
  } else {
    store.wishlist_items.push({
      id: newId(),
      user_id: LOCAL_USER_ID,
      image_url: null,
      ...payload,
      created_at: now,
    });
  }

  await writeStore(store);
  revalidatePath("/metas");
  return { ok: true };
}

export async function convertWishlistToGoal(wishlistId: string) {
  const store = await readStore();
  const item = store.wishlist_items.find((w) => w.id === wishlistId);
  if (!item) return { error: "Ítem no encontrado" };

  const now = new Date().toISOString();
  store.goals.push({
    id: newId(),
    user_id: LOCAL_USER_ID,
    name: item.name,
    target_amount: item.estimated_price || 10_000,
    saved_amount: 0,
    image_url: item.image_url,
    target_date: null,
    account_id: null,
    is_completed: false,
    created_at: now,
    updated_at: now,
  });
  item.status = "saving";
  item.updated_at = now;

  await writeStore(store);
  revalidatePath("/metas");
  return { ok: true };
}

export async function deleteWishlistItem(id: string) {
  const store = await readStore();
  store.wishlist_items = store.wishlist_items.filter((w) => w.id !== id);
  await writeStore(store);
  revalidatePath("/metas");
  return { ok: true };
}
