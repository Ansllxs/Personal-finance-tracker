"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MoneyAmount } from "@/components/shared/money-amount";
import { copyBudgetToNextMonth, saveBudgetItem } from "@/lib/actions/budgets";
import { budgetHealth } from "@/lib/finance";
import { formatCRC, formatPercent, monthNameES } from "@/lib/format";
import { clampPercent, endOfMonth, startOfMonth, toISODate } from "@/lib/utils";
import type { Budget, BudgetItem, Category, Transaction } from "@/lib/types";

export function BudgetClient({
  month,
  year,
  budget,
  items,
  categories,
  transactions,
  suggestion,
}: {
  month: number;
  year: number;
  budget: Budget | null;
  items: BudgetItem[];
  categories: Category[];
  transactions: Transaction[];
  suggestion: { needs: number; wants: number; savings: number };
}) {
  const [pending, startTransition] = useTransition();
  const from = toISODate(startOfMonth(new Date(year, month - 1, 1)));
  const to = toISODate(endOfMonth(new Date(year, month - 1, 1)));

  const rows = useMemo(() => {
    return categories.map((cat) => {
      const item = items.find((i) => i.category_id === cat.id);
      const allocated = item?.allocated_amount ?? 0;
      const spent = transactions
        .filter(
          (tx) =>
            tx.status === "confirmed" &&
            tx.tag === "personal" &&
            (tx.type === "expense" || tx.type === "goal_contribution") &&
            tx.category_id === cat.id &&
            tx.date >= from &&
            tx.date <= to
        )
        .reduce((s, tx) => s + tx.amount, 0);
      const remaining = allocated - spent;
      const pct = allocated > 0 ? clampPercent((spent / allocated) * 100) : 0;
      const health = budgetHealth(spent, allocated);
      return { cat, item, allocated, spent, remaining, pct, health };
    });
  }, [categories, items, transactions, from, to]);

  const totalAllocated = rows.reduce((s, r) => s + r.allocated, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  const prev =
    month === 1
      ? { month: 12, year: year - 1 }
      : { month: month - 1, year };
  const next =
    month === 12
      ? { month: 1, year: year + 1 }
      : { month: month + 1, year };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/presupuesto?month=${prev.month}&year=${prev.year}`}>
              ← Anterior
            </Link>
          </Button>
          <h2 className="font-display text-xl font-semibold">
            {monthNameES(month)} {year}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href={`/presupuesto?month=${next.month}&year=${next.year}`}>
              Siguiente →
            </Link>
          </Button>
        </div>
        <Button
          variant="secondary"
          disabled={pending || !budget}
          onClick={() =>
            startTransition(async () => {
              const res = await copyBudgetToNextMonth(month, year);
              if (res.error) toast.error(res.error);
              else toast.success("Presupuesto copiado al mes siguiente");
            })
          }
        >
          Copiar al siguiente mes
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">
              Ingreso esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyAmount amount={budget?.expected_income ?? 295000} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">
              Asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyAmount amount={totalAllocated} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">
              Gastado real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyAmount amount={totalSpent} size="lg" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed bg-sage/15">
        <CardContent className="p-4 text-sm text-ink-muted">
          <p className="font-medium text-ink">Sugerencia suave (50 / 30 / 20)</p>
          <p className="mt-1">
            Necesidades {formatCRC(suggestion.needs)} · Gustos{" "}
            {formatCRC(suggestion.wants)} · Ahorro {formatCRC(suggestion.savings)}.
            Úsala solo si te sirve — puedes ignorarla por completo.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.cat.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: row.cat.color }}
                    aria-hidden
                  />
                  <p className="font-medium">{row.cat.name}</p>
                  <HealthBadge health={row.health} />
                </div>
                <p className="text-sm text-ink-muted">
                  Restante:{" "}
                  <MoneyAmount amount={row.remaining} size="sm" signed />
                </p>
              </div>
              <Progress
                value={row.pct}
                indicatorClassName={
                  row.health === "over"
                    ? "bg-rose-deep"
                    : row.health === "near"
                      ? "bg-[color:var(--amber-soft)]"
                      : "bg-sage"
                }
              />
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-xs text-ink-muted">Presupuesto</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    defaultValue={row.allocated}
                    disabled={!budget || pending}
                    onBlur={(e) => {
                      if (!budget) return;
                      const value = Number(e.target.value) || 0;
                      startTransition(async () => {
                        const res = await saveBudgetItem(
                          budget.id,
                          row.cat.id,
                          value
                        );
                        if (res.error) toast.error(res.error);
                      });
                    }}
                  />
                </label>
                <div>
                  <p className="text-xs text-ink-muted">Gasto real</p>
                  <p className="mt-2 font-semibold tabular-nums">
                    {formatCRC(row.spent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Usado</p>
                  <p className="mt-2 font-semibold">{formatPercent(row.pct)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: ReturnType<typeof budgetHealth> }) {
  if (health === "ok") return <Badge variant="ok">Bien</Badge>;
  if (health === "near") return <Badge variant="near">Cerca del límite</Badge>;
  if (health === "over") return <Badge variant="over">Excedido</Badge>;
  return <Badge variant="outline">Sin asignar</Badge>;
}
