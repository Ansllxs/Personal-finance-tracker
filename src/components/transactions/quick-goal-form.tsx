"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCRC } from "@/lib/format";
import { upsertTransaction } from "@/lib/actions/transactions";
import { cn, toISODate } from "@/lib/utils";
import type { Account, Goal } from "@/lib/types";

export function QuickGoalForm({
  accounts,
  goals,
  defaultGoalId,
  onSuccess,
}: {
  accounts: Account[];
  goals: Goal[];
  defaultGoalId?: string;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [goalId, setGoalId] = useState(defaultGoalId ?? "");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const openGoals = useMemo(
    () => goals.filter((g) => !g.is_completed),
    [goals]
  );

  const cashAccounts = useMemo(
    () => accounts.filter((a) => a.is_active && a.type !== "credit_card"),
    [accounts]
  );

  const defaultAccount =
    accountId ||
    cashAccounts.find((a) => a.type === "bank")?.id ||
    cashAccounts.find((a) => a.type === "cash")?.id ||
    cashAccounts[0]?.id ||
    "";

  const selectedGoal =
    openGoals.find((g) => g.id === (goalId || openGoals[0]?.id)) ?? null;

  const numericAmount = Number(amount.replace(/[^\d]/g, ""));

  function save() {
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Escribe cuánto aportas");
      amountRef.current?.focus();
      return;
    }
    const goal = goalId || openGoals[0]?.id;
    if (!goal) {
      toast.error("Crea una meta primero");
      return;
    }
    const account = accountId || defaultAccount;
    if (!account) {
      toast.error("Elige de qué cuenta sale");
      return;
    }

    startTransition(async () => {
      const goalName =
        openGoals.find((g) => g.id === goal)?.name ?? "meta";
      const result = await upsertTransaction({
        date: toISODate(new Date()),
        type: "goal_contribution",
        amount: numericAmount,
        account_id: account,
        goal_id: goal,
        description: note.trim() || `Aporte: ${goalName}`,
        tag: "personal",
        status: "confirmed",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${formatCRC(numericAmount)} a ${goalName} · se rebajó de tu cuenta`
      );
      onSuccess?.();
    });
  }

  if (openGoals.length === 0) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm text-ink-muted">
          Todavía no tienes metas abiertas.
        </p>
        <Button asChild variant="secondary">
          <Link href="/metas">Crear una meta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-lavender/10 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Monto del aporte
        </p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="text-3xl font-semibold text-ink">₡</span>
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
            aria-label="Monto del aporte"
          />
        </div>
        {numericAmount > 0 && (
          <p className="mt-1 text-sm text-ink-muted">
            {formatCRC(numericAmount)} se rebaja de la cuenta
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">¿A qué meta?</p>
        <div className="flex flex-wrap gap-2">
          {openGoals.map((g) => {
            const selected = (goalId || openGoals[0]?.id) === g.id;
            const left = Math.max(0, g.target_amount - g.saved_amount);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoalId(g.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-lavender bg-lavender/30 text-ink"
                    : "border-rose-dust/20 bg-paper text-ink-muted hover:bg-cream"
                )}
              >
                <span className="block">{g.name}</span>
                <span className="text-xs font-normal text-ink-muted">
                  Faltan {formatCRC(left)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">¿De qué cuenta sale?</p>
        <div className="flex flex-wrap gap-2">
          {cashAccounts.map((a) => {
            const selected = (accountId || defaultAccount) === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-medium",
                  selected
                    ? "border-rose-dust bg-rose-mist text-rose-deep"
                    : "border-rose-dust/20 bg-paper text-ink-muted"
                )}
              >
                {a.name}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-muted">
          Ese monto baja del saldo de la cuenta y sube en la meta
          {selectedGoal ? ` “${selectedGoal.name}”` : ""}.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="goal-note" className="text-sm font-medium">
          Nota <span className="font-normal text-ink-muted">(opcional)</span>
        </label>
        <Input
          id="goal-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. ahorro de la semana…"
        />
      </div>

      <Button
        type="button"
        className="h-14 w-full text-base"
        disabled={pending}
        onClick={save}
      >
        {pending ? "Guardando…" : "Guardar aporte"}
      </Button>
    </div>
  );
}
