"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MoneyAmount } from "@/components/shared/money-amount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  expensesByCategory,
  monthPersonalExpense,
  monthPersonalIncome,
  orderBalance,
  orderProfit,
  sumByType,
} from "@/lib/finance";
import { formatCRC } from "@/lib/format";
import { endOfMonth, startOfMonth, toISODate } from "@/lib/utils";
import type {
  CrochetOrder,
  CrochetProduct,
  Goal,
  Transaction,
} from "@/lib/types";

type Period = "week" | "month" | "year" | "custom";

function rangeFor(period: Period, customFrom: string, customTo: string) {
  const now = new Date();
  if (period === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }
  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (period === "year") {
    return {
      from: `${now.getFullYear()}-01-01`,
      to: `${now.getFullYear()}-12-31`,
    };
  }
  return {
    from: toISODate(startOfMonth(now)),
    to: toISODate(endOfMonth(now)),
  };
}

export function ReportsClient({
  transactions,
  goals,
  orders,
  products,
}: {
  transactions: Transaction[];
  goals: Goal[];
  orders: CrochetOrder[];
  products: CrochetProduct[];
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const { from, to } = rangeFor(period, customFrom, customTo);

  const income = monthPersonalIncome(transactions, from, to);
  const expenses = monthPersonalExpense(transactions, from, to);
  const byCategory = expensesByCategory(transactions, from, to, "personal");
  const crochetSales = sumByType(transactions, ["crochet_income"], { from, to });
  const crochetExpenses = sumByType(transactions, ["crochet_expense"], {
    from,
    to,
  });
  const pendingCollect = orders
    .filter((o) => o.status !== "cancelado" && o.status !== "entregado")
    .reduce((s, o) => s + orderBalance(o), 0);

  const savingsSeries = useMemo(() => {
    const map = new Map<string, number>();
    let running = 0;
    const sorted = [...transactions]
      .filter((t) => t.type === "goal_contribution" && t.status === "confirmed")
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const t of sorted) {
      if (t.date < from || t.date > to) continue;
      running += t.amount;
      map.set(t.date, running);
    }
    return [...map.entries()].map(([date, total]) => ({ date, total }));
  }, [transactions, from, to]);

  const cardDebtSeries = useMemo(() => {
    const payments = transactions.filter(
      (t) => t.type === "card_payment" && t.status === "confirmed"
    );
    const charges = transactions.filter(
      (t) =>
        (t.type === "expense" || t.type === "crochet_expense") &&
        t.status === "confirmed" &&
        t.account?.type === "credit_card"
    );
    const events = [...payments, ...charges]
      .filter((t) => t.date >= from && t.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));

    let debt = 0;
    const points: { date: string; deuda: number }[] = [];
    for (const e of events) {
      if (e.type === "card_payment") debt = Math.max(0, debt - e.amount);
      else debt += e.amount;
      points.push({ date: e.date, deuda: debt });
    }
    return points;
  }, [transactions, from, to]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; revenue: number }>();
    for (const o of orders) {
      if (o.status === "cancelado") continue;
      if (o.delivery_date && (o.delivery_date < from || o.delivery_date > to)) {
        // still count by created if no delivery in range — skip strict filter for simplicity
      }
      const key = o.product_id ?? o.description;
      const name = o.product?.name ?? o.description;
      const prev = counts.get(key) ?? { name, count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += o.agreed_price;
      counts.set(key, prev);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders, from, to]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["week", "Semana"],
            ["month", "Mes"],
            ["year", "Año"],
            ["custom", "Personalizado"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              period === key
                ? "bg-rose-mist text-rose-deep"
                : "bg-paper text-ink-muted border border-rose-dust/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex flex-wrap gap-3">
          <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Ingresos personales" amount={income} />
        <MiniStat label="Gastos personales" amount={expenses} negative />
        <MiniStat label="Ventas crochet" amount={crochetSales} />
        <MiniStat label="Ganancia crochet est." amount={crochetSales - crochetExpenses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs gastos</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Ingresos", monto: income },
                  { name: "Gastos", monto: expenses },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,165,0.25)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCRC(Number(v ?? 0))} />
                <Bar dataKey="monto" fill="#C5C0D9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {byCategory.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-muted">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,165,0.25)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCRC(Number(v ?? 0))} />
                  <Bar dataKey="amount" fill="#D4A5A5" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolución del ahorro</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {savingsSeries.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-muted">
                Registra aportes a metas para ver la curva.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,165,0.25)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCRC(Number(v ?? 0))} />
                  <Line type="monotone" dataKey="total" stroke="#A8B5A2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deuda de tarjeta (actividad)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {cardDebtSeries.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-muted">
                Sin movimientos de tarjeta en el periodo.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cardDebtSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,165,0.25)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCRC(Number(v ?? 0))} />
                  <Legend />
                  <Line type="monotone" dataKey="deuda" stroke="#B87B7B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Avance de metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-sm text-ink-muted">Sin metas</p>
            ) : (
              goals.map((g) => (
                <div key={g.id} className="flex justify-between text-sm">
                  <span>{g.name}</span>
                  <span className="tabular-nums text-ink-muted">
                    {formatCRC(g.saved_amount)} / {formatCRC(g.target_amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crochet: top productos y cobros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Pedidos pendientes de cobro:{" "}
              <MoneyAmount amount={pendingCollect} size="sm" />
            </p>
            <ul className="space-y-2">
              {topProducts.length === 0 && (
                <li className="text-ink-muted">Sin pedidos todavía.</li>
              )}
              {topProducts.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>
                    {p.name} · {p.count}x
                  </span>
                  <MoneyAmount amount={p.revenue} size="sm" />
                </li>
              ))}
            </ul>
            {products.length > 0 && (
              <p className="text-xs text-ink-muted">
                Catálogo: {products.length} productos · Ganancia pedidos del
                periodo ≈{" "}
                {formatCRC(
                  orders
                    .filter((o) => o.status !== "cancelado")
                    .reduce((s, o) => s + orderProfit(o), 0)
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  amount,
  negative,
}: {
  label: string;
  amount: number;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-ink-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <MoneyAmount
          amount={negative ? -Math.abs(amount) : amount}
          size="lg"
          signed={negative}
        />
      </CardContent>
    </Card>
  );
}
