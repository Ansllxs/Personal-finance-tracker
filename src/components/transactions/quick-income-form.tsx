"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCRC } from "@/lib/format";
import { upsertTransaction } from "@/lib/actions/transactions";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn, toISODate } from "@/lib/utils";
import type { Account, Category, PaymentMethod } from "@/lib/types";

export function QuickIncomeForm({
  accounts,
  categories,
  onSuccess,
}: {
  accounts: Account[];
  categories: Category[];
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("sinpe");
  const [note, setNote] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories]
  );

  const cashAccounts = useMemo(
    () => accounts.filter((a) => a.is_active && a.type !== "credit_card"),
    [accounts]
  );

  const defaultAccount =
    accountId ||
    cashAccounts.find((a) => a.type === "bank")?.id ||
    cashAccounts[0]?.id ||
    "";

  const numericAmount = Number(amount.replace(/[^\d]/g, ""));

  function save() {
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Escribe cuánto te entró");
      amountRef.current?.focus();
      return;
    }
    const account = accountId || defaultAccount;
    if (!account) {
      toast.error("Elige a qué cuenta entró");
      return;
    }

    startTransition(async () => {
      const result = await upsertTransaction({
        date: toISODate(new Date()),
        type: "income",
        amount: numericAmount,
        category_id: categoryId || incomeCategories[0]?.id || null,
        account_id: account,
        description: note.trim() || "Ingreso",
        payment_method: method || null,
        tag: "personal",
        status: "confirmed",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Ingreso de ${formatCRC(numericAmount)} guardado`);
      onSuccess?.();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-sage/30 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          ¿Cuánto te entró?
        </p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="font-display text-3xl text-ink">₡</span>
          <Input
            ref={amountRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
            className="h-16 border-0 bg-transparent text-center font-display text-4xl font-semibold tabular-nums shadow-none focus-visible:ring-0 md:text-4xl"
            aria-label="Monto del ingreso"
          />
        </div>
        {numericAmount > 0 && (
          <p className="mt-1 text-sm text-ink-muted">{formatCRC(numericAmount)}</p>
        )}
      </div>

      {incomeCategories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">De dónde / categoría</p>
          <div className="flex flex-wrap gap-2">
            {incomeCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-medium",
                  categoryId === c.id ||
                    (!categoryId && c.id === incomeCategories[0]?.id)
                    ? "border-sage bg-sage/40 text-ink"
                    : "border-rose-dust/20 bg-paper text-ink-muted"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">¿A qué cuenta entró?</p>
        <div className="flex flex-wrap gap-2">
          {cashAccounts.map((a) => {
            const selected = (accountId || defaultAccount) === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAccountId(a.id);
                  if (a.type === "cash") setMethod("efectivo");
                  else if (a.type === "bank") setMethod("sinpe");
                }}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-medium",
                  selected
                    ? "border-lavender bg-lavender/30 text-ink"
                    : "border-rose-dust/20 bg-paper text-ink-muted"
                )}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">¿Cómo te pagaron?</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-medium",
                method === m
                  ? "border-sage bg-sage/40 text-ink"
                  : "border-rose-dust/20 bg-paper text-ink-muted"
              )}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="income-note" className="text-sm font-medium">
          Nota <span className="font-normal text-ink-muted">(opcional)</span>
        </label>
        <Input
          id="income-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. me depositaron, venta, regalo…"
        />
      </div>

      <Button
        type="button"
        className="h-14 w-full text-base"
        disabled={pending}
        onClick={save}
      >
        {pending ? "Guardando…" : "Guardar ingreso"}
      </Button>
    </div>
  );
}
