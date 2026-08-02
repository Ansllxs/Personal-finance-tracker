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
import { TransactionForm } from "./transaction-form";
import type { Account, Category, Goal } from "@/lib/types";

type Mode = "gasto" | "ingreso" | "otro";

export function AddTransactionFab({
  accounts,
  categories,
  goals,
  defaultOpen = false,
}: {
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<Mode>("gasto");

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMode("gasto");
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
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("gasto")}
            className={cn(
              "rounded-xl py-2.5 text-sm font-semibold",
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
              "rounded-xl py-2.5 text-sm font-semibold",
              mode === "ingreso"
                ? "bg-sage/50 text-ink"
                : "bg-cream text-ink-muted"
            )}
          >
            Me entró
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
              onSuccess={() => setOpen(false)}
            />
          </>
        )}

        {mode === "otro" && (
          <>
            <SheetHeader>
              <SheetTitle>Otro movimiento</SheetTitle>
              <SheetDescription>
                Transferencia, tarjeta, crochet o aporte a meta.
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
