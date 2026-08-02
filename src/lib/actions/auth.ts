"use server";

import { redirect } from "next/navigation";

/** Auth desactivado: la app corre en modo local sin login. */
export async function signIn() {
  redirect("/");
}

export async function signUp() {
  redirect("/");
}

export async function signOut() {
  redirect("/");
}
