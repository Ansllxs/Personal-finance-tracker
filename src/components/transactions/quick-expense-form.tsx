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

export function QuickExpenseForm({
  accounts,
  categories,
  onSuccess,
  onNeedMore,
}: {
  accounts: Account[];
  categories: Category[];
  onSuccess?: () => void;
  onNeedMore?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [note, setNote] = useState("");
  const [keepOpen, setKeepOpen] = useState(true);
  const amountRef = useRef<HTMLInputElement>(null);

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.type === "expense" && c.scope !== "crochet"
      ),
    [categories]
  );

  const payAccounts = useMemo(() => accounts.filter((a) => a.is_active), [accounts]);

  const defaultAccount =
    accountId ||
    payAccounts.find((a) => a.type === "bank")?.id ||
    payAccounts.find((a) => a.type === "cash")?.id ||
    payAccounts[0]?.id ||
    "";

  const selectedAccount = payAccounts.find(
    (a) => a.id === (accountId || defaultAccount)
  );

  const numericAmount = Number(amount.replace(/[^\d]/g, ""));

  function save(andAnother: boolean) {
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Escribe cuánto gastaste");
      amountRef.current?.focus();
      return;
    }
    if (!categoryId) {
      toast.error("Elige una categoría");
      return;
    }
    const account = accountId || defaultAccount;
    if (!account) {
      toast.error("Elige de qué cuenta salió");
      return;
    }

    const resolvedMethod: PaymentMethod | null =
      method ||
      (selectedAccount?.type === "cash"
        ? "efectivo"
        : selectedAccount?.type === "bank"
          ? "sinpe"
          : null);

    startTransition(async () => {
      const result = await upsertTransaction({
        date: toISODate(new Date()),
        type: "expense",
        amount: numericAmount,
        category_id: categoryId,
        account_id: account,
        description: note.trim() || null,
        payment_method: resolvedMethod,
        tag: "personal",
        status: "confirmed",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Gasto de ${formatCRC(numericAmount)} guardado`);

      if (andAnother) {
        setAmount("");
        setNote("");
        amountRef.current?.focus();
      } else {
        onSuccess?.();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-rose-mist/60 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-rose-deep/80">
          Monto del gasto
        </p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="text-3xl font-semibold text-rose-deep">₡</span>
          <Input
            ref={amountRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
            className="h-16 border-0 bg-transparent text-center text-4xl font-semibold tabular-nums shadow-none focus-visible:ring-0 md:text-4xl"
            aria-label="Monto del gasto"
          />
        </div>
        {numericAmount > 0 && (
          <p className="mt-1 text-sm text-ink-muted">{formatCRC(numericAmount)}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Categoría</p>
        <div className="flex flex-wrap gap-2">
          {expenseCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                categoryId === c.id
                  ? "border-rose-dust bg-rose-mist text-rose-deep"
                  : "border-rose-dust/20 bg-paper text-ink-muted hover:bg-cream"
              )}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ background: c.color }}
                aria-hidden
              />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">¿De qué cuenta salió?</p>
        <div className="flex flex-wrap gap-2">
          {payAccounts.map((a) => {
            const selected = (accountId || defaultAccount) === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAccountId(a.id);
                  if (a.type === "cash") setMethod("efectivo");
                  else if (a.type === "bank") setMethod("sinpe");
                  else setMethod("");
                }}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-lavender bg-lavender/30 text-ink"
                    : "border-rose-dust/20 bg-paper text-ink-muted hover:bg-cream"
                )}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">¿Cómo pagaste?</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                method === m ||
                  (!method &&
                    ((selectedAccount?.type === "bank" && m === "sinpe") ||
                      (selectedAccount?.type === "cash" && m === "efectivo")))
                  ? "border-rose-dust bg-rose-mist text-rose-deep"
                  : "border-rose-dust/20 bg-paper text-ink-muted hover:bg-cream"
              )}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          SINPE usa tu cuenta bancaria; no es una cuenta aparte.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="quick-note" className="text-sm font-medium text-ink">
          Nota <span className="font-normal text-ink-muted">(opcional)</span>
        </label>
        <Input
          id="quick-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. almuerzo, Uber al U…"
        />
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          className="h-14 w-full text-base"
          disabled={pending}
          onClick={() => save(keepOpen)}
        >
          {pending ? "Guardando…" : "Guardar gasto"}
        </Button>
        <label className="flex items-center gap-2 px-1 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={keepOpen}
            onChange={(e) => setKeepOpen(e.target.checked)}
            className="rounded border-rose-dust/40"
          />
          Seguir agregando gastos
        </label>
        {onNeedMore && (
          <button
            type="button"
            onClick={onNeedMore}
            className="w-full py-2 text-center text-sm text-rose-deep underline-offset-2 hover:underline"
          >
            Otro tipo: ingreso, transferencia, crochet…
          </button>
        )}
      </div>
    </div>
  );
}
