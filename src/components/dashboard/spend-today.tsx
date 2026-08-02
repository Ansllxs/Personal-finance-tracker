"use client";

import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { MoneyAmount } from "@/components/shared/money-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QuickExpenseForm } from "@/components/transactions/quick-expense-form";
import { formatDateES } from "@/lib/format";
import { toISODate } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/lib/types";

export function SpendToday({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const today = toISODate(new Date());

  const todayExpenses = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.date === today &&
          t.status === "confirmed" &&
          t.tag === "personal" &&
          (t.type === "expense" || t.type === "goal_contribution")
      ),
    [transactions, today]
  );

  const totalToday = todayExpenses.reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Card className="border-rose-dust/30 bg-gradient-to-br from-rose-mist/60 to-paper animate-fade-up-delay">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-rose-deep" />
            Gastos de hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <MoneyAmount amount={totalToday} size="xl" />
            <p className="mt-1 text-xs text-ink-muted">
              {todayExpenses.length === 0
                ? "Aún no registraste nada hoy"
                : `${todayExpenses.length} gasto${todayExpenses.length === 1 ? "" : "s"} · ${formatDateES(today)}`}
            </p>
          </div>

          {todayExpenses.length > 0 && (
            <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
              {todayExpenses.slice(0, 8).map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-paper/80 px-3 py-2"
                >
                  <span className="min-w-0 truncate">
                    {tx.description || tx.category?.name || "Gasto"}
                    <span className="ml-1 text-xs text-ink-muted">
                      · {tx.category?.name ?? "Sin cat."}
                    </span>
                  </span>
                  <MoneyAmount amount={-tx.amount} size="sm" signed />
                </li>
              ))}
            </ul>
          )}

          <Button className="h-12 w-full" onClick={() => setOpen(true)}>
            Anotar un gasto
          </Button>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Registrar gasto</SheetTitle>
            <SheetDescription>
              Rápido: monto, categoría y con qué pagaste.
            </SheetDescription>
          </SheetHeader>
          <QuickExpenseForm
            accounts={accounts}
            categories={categories}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
