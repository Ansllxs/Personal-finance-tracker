"use client";

import { useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { MoneyAmount } from "@/components/shared/money-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addBusinessExpense,
  transferCrochetProfit,
} from "@/lib/actions/crochet";
import { formatCRC, monthNameES } from "@/lib/format";
import { toISODate } from "@/lib/utils";
import type { Account } from "@/lib/types";

export function CrochetFinanceClient({
  sales,
  materialExpenses,
  packagingShipping,
  netProfit,
  pendingPayments,
  monthlySales,
  accounts,
}: {
  sales: number;
  materialExpenses: number;
  packagingShipping: number;
  netProfit: number;
  pendingPayments: number;
  monthlySales: { month: number; total: number }[];
  accounts: Account[];
}) {
  const [pending, startTransition] = useTransition();
  const cash = accounts.filter((a) => a.type !== "credit_card");

  const chartData = monthlySales.map((m) => ({
    name: monthNameES(m.month).slice(0, 3),
    total: m.total,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat title="Ventas del mes" amount={sales} />
        <Stat title="Gastos materiales" amount={materialExpenses} negative />
        <Stat title="Empaques / envíos" amount={packagingShipping} negative />
        <Stat title="Utilidad neta est." amount={netProfit} />
        <Stat title="Por cobrar" amount={pendingPayments} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas mensuales</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.every((d) => d.total === 0) ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              Aún no hay ventas de crochet para graficar.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,165,165,0.25)" />
                <XAxis dataKey="name" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCRC(Number(v ?? 0))} />
                <Bar dataKey="total" fill="#D4A5A5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrar gasto del negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              action={(fd) => {
                startTransition(async () => {
                  const res = await addBusinessExpense({
                    date: String(fd.get("date")),
                    category: String(fd.get("category")) as
                      | "Materiales"
                      | "Empaques"
                      | "Envíos"
                      | "Herramientas"
                      | "Otros",
                    amount: Number(fd.get("amount")),
                    description: String(fd.get("description") || "") || null,
                    account_id: String(fd.get("account_id")),
                  });
                  if (res.error) toast.error(res.error);
                  else toast.success("Gasto crochet registrado");
                });
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Monto</Label>
                  <Input id="amount" name="amount" type="number" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={toISODate(new Date())}
                    required
                  />
                </div>
              </div>
              <label className="block space-y-1 text-sm">
                <span>Categoría</span>
                <select
                  name="category"
                  className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                  defaultValue="Materiales"
                >
                  {["Materiales", "Empaques", "Envíos", "Herramientas", "Otros"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>Cuenta</span>
                <select
                  name="account_id"
                  required
                  className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                  defaultValue={cash[0]?.id}
                >
                  {cash.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" />
              </div>
              <Button type="submit" disabled={pending || cash.length === 0}>
                Guardar gasto
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transferir ganancias a personal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-ink-muted">
              Se registra como transferencia: sale de una cuenta y entra a otra,
              sin mezclar gráficas de crochet con gastos personales.
            </p>
            <form
              className="space-y-3"
              action={(fd) => {
                startTransition(async () => {
                  const res = await transferCrochetProfit({
                    amount: Number(fd.get("amount")),
                    from_account_id: String(fd.get("from_account_id")),
                    to_account_id: String(fd.get("to_account_id")),
                    date: String(fd.get("date")),
                    description: String(fd.get("description") || ""),
                  });
                  if (res.error) toast.error(res.error);
                  else toast.success("Transferencia registrada");
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="tamount">Monto</Label>
                <Input id="tamount" name="amount" type="number" required />
              </div>
              <label className="block space-y-1 text-sm">
                <span>Desde</span>
                <select
                  name="from_account_id"
                  required
                  className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                  defaultValue={cash[0]?.id}
                >
                  {cash.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>Hacia (personal)</span>
                <select
                  name="to_account_id"
                  required
                  className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                  defaultValue={cash[1]?.id ?? cash[0]?.id}
                >
                  {cash.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-1.5">
                <Label htmlFor="tdate">Fecha</Label>
                <Input
                  id="tdate"
                  name="date"
                  type="date"
                  defaultValue={toISODate(new Date())}
                  required
                />
              </div>
              <Button type="submit" variant="secondary" disabled={pending || cash.length < 1}>
                Transferir
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  title,
  amount,
  negative,
}: {
  title: string;
  amount: number;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-ink-muted">{title}</CardTitle>
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
