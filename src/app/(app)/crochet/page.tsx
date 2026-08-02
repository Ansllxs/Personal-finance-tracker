import Link from "next/link";
import { CalendarDays, Package, Scissors, ShoppingBag, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyAmount } from "@/components/shared/money-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCrochetOrders, getTransactions } from "@/lib/data";
import { orderBalance, sumByType } from "@/lib/finance";
import { formatDateES } from "@/lib/format";
import { endOfMonth, startOfMonth, toISODate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Crochet" };

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return toISODate(date);
}

export default async function CrochetPage() {
  const [orders, transactions] = await Promise.all([
    getCrochetOrders(),
    getTransactions(),
  ]);

  const now = new Date();
  const from = toISODate(startOfMonth(now));
  const to = toISODate(endOfMonth(now));
  const today = toISODate(now);
  const weekEnd = addDays(today, 7);

  const sales = sumByType(transactions, ["crochet_income"], { from, to });
  const active = orders.filter((o) =>
    ["consulta", "confirmado", "en_proceso", "listo"].includes(o.status)
  );
  const owed = orders
    .filter((o) => o.status !== "cancelado" && orderBalance(o) > 0)
    .reduce((s, o) => s + orderBalance(o), 0);

  const deliveries = orders
    .filter(
      (o) =>
        o.delivery_date &&
        o.delivery_date >= today &&
        o.delivery_date <= weekEnd &&
        !["cancelado", "entregado"].includes(o.status)
    )
    .sort((a, b) => (a.delivery_date ?? "").localeCompare(b.delivery_date ?? ""));

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Crochet"
        description="Pedidos y ventas del negocio, aparte de tus gastos personales."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-ink-muted">
              Ventas del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyAmount amount={sales} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-ink-muted">
              Pedidos activos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {active.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-ink-muted">Por cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyAmount amount={owed} size="lg" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/crochet/pedidos">
            <ShoppingBag className="h-4 w-4" /> Pedidos
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/crochet/clientes">
            <Users className="h-4 w-4" /> Clientes
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/crochet/productos">
            <Package className="h-4 w-4" /> Hechos
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/crochet/finanzas">Finanzas</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/crochet/materiales">Materiales</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-4 w-4" /> Entregas esta semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No hay entregas programadas en los próximos 7 días.
            </p>
          ) : (
            <ul className="divide-y divide-rose-dust/15">
              {deliveries.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{order.description}</p>
                    <p className="text-xs text-ink-muted">
                      {order.customer?.name ?? "Sin cliente"}
                      {order.delivery_date
                        ? ` · ${formatDateES(order.delivery_date)}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/crochet/pedidos">Ver pedidos</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scissors className="h-4 w-4" /> Pedidos recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Aún no hay pedidos.{" "}
              <Link href="/crochet/pedidos" className="text-rose-deep underline">
                Crear el primero
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-rose-dust/15">
              {orders.slice(0, 5).map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{order.description}</p>
                    <p className="text-xs text-ink-muted">
                      Saldo <MoneyAmount amount={orderBalance(order)} size="sm" />
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/crochet/pedidos">Ver / editar pedidos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
