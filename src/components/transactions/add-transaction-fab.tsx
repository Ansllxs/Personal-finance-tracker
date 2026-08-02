"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { QuickExpenseForm } from "./quick-expense-form";
import { QuickIncomeForm } from "./quick-income-form";
import { QuickGoalForm } from "./quick-goal-form";
import { TransactionForm } from "./transaction-form";
import type { Account, Category, Goal } from "@/lib/types";

type Mode = "gasto" | "ingreso" | "meta" | "otro";

export function AddTransactionFab({
  accounts,
  categories,
  goals,
  defaultOpen = false,
  suggestedBecaAmount = 0,
  defaultMode = "gasto",
}: {
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  defaultOpen?: boolean;
  suggestedBecaAmount?: number;
  defaultMode?: Mode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<Mode>(defaultMode);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMode(defaultMode);
      }}
    >
      <SheetTrigger asChild>
        <Button
          size="fab"
          className="fixed bottom-20 right-4 z-30 animate-soft-pulse lg:bottom-8 lg:right-8"
          aria-label="Agregar movimiento"
        >
          <Plus className="h-5 w-5" />
          Sumar
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="mb-4 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setMode("gasto")}
            className={cn(
              "rounded-xl py-2.5 text-xs font-semibold sm:text-sm",
              mode === "gasto"
                ? "bg-rose-mist text-rose-deep"
                : "bg-cream text-ink-muted"
            )}
          >
            Gasté
          </button>
          <button
            type="button"
            onClick={() => setMode("ingreso")}
            className={cn(
              "rounded-xl py-2.5 text-xs font-semibold sm:text-sm",
              mode === "ingreso"
                ? "bg-sage/50 text-ink"
                : "bg-cream text-ink-muted"
            )}
          >
            Me entró
          </button>
          <button
            type="button"
            onClick={() => setMode("meta")}
            className={cn(
              "rounded-xl py-2.5 text-xs font-semibold sm:text-sm",
              mode === "meta"
                ? "bg-lavender/40 text-ink"
                : "bg-cream text-ink-muted"
            )}
          >
            Meta
          </button>
        </div>

        {mode === "gasto" && (
          <>
            <SheetHeader>
              <SheetTitle>Registrar gasto</SheetTitle>
              <SheetDescription>Monto, categoría y listo.</SheetDescription>
            </SheetHeader>
            <QuickExpenseForm
              accounts={accounts}
              categories={categories}
              onSuccess={() => setOpen(false)}
              onNeedMore={() => setMode("otro")}
            />
          </>
        )}

        {mode === "ingreso" && (
          <>
            <SheetHeader>
              <SheetTitle>Registrar ingreso</SheetTitle>
              <SheetDescription>
                Cuando te depositan, te pagan o te entra plata.
              </SheetDescription>
            </SheetHeader>
            <QuickIncomeForm
              accounts={accounts}
              categories={categories}
              suggestedBecaAmount={suggestedBecaAmount}
              onSuccess={() => setOpen(false)}
            />
          </>
        )}

        {mode === "meta" && (
          <>
            <SheetHeader>
              <SheetTitle>Aporte a meta</SheetTitle>
              <SheetDescription>
                Se rebaja de la cuenta que elijas y sube en tu meta.
              </SheetDescription>
            </SheetHeader>
            <QuickGoalForm
              accounts={accounts}
              goals={goals}
              onSuccess={() => setOpen(false)}
            />
          </>
        )}

        {mode === "otro" && (
          <>
            <SheetHeader>
              <SheetTitle>Otro movimiento</SheetTitle>
              <SheetDescription>
                Transferencia, tarjeta o crochet.
              </SheetDescription>
            </SheetHeader>
            <button
              type="button"
              onClick={() => setMode("gasto")}
              className="mb-3 text-sm text-rose-deep underline-offset-2 hover:underline"
            >
              ← Volver
            </button>
            <TransactionForm
              accounts={accounts}
              categories={categories}
              goals={goals}
              onSuccess={() => setOpen(false)}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
