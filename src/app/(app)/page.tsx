import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { AddTransactionFab } from "@/components/transactions/add-transaction-fab";
import { SpendToday } from "@/components/dashboard/spend-today";
import { MonthNav } from "@/components/shared/month-nav";
import { MoneyAmount } from "@/components/shared/money-amount";
import { FlowerCorner, GinghamRibbon, ScrapWashi } from "@/components/shared/decorations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { getDashboardData } from "@/lib/data";
import {
  monthPersonalExpense,
  monthPersonalIncome,
  personalAvailableBalance,
} from "@/lib/finance";
import { formatDateES, greetingForHour, monthNameES } from "@/lib/format";
import { endOfMonth, startOfMonth, toISODate } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = Number(sp.month) || now.getMonth() + 1;
  const year = Number(sp.year) || now.getFullYear();
  const data = await getDashboardData();
  const from = toISODate(startOfMonth(new Date(year, month - 1, 1)));
  const to = toISODate(endOfMonth(new Date(year, month - 1, 1)));
  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  const { total: available, anyConfigured } = personalAvailableBalance(
    data.accounts
  );
  const income = monthPersonalIncome(data.transactions, from, to);
  const expenses = monthPersonalExpense(data.transactions, from, to);
  const name = data.profile?.display_name ?? "Angie";

  const recent = data.transactions
    .filter(
      (t) => t.tag === "personal" && t.date >= from && t.date <= to
    )
    .slice(0, 8);

  return (
    <div className="relative space-y-5 pb-24">
      <FlowerCorner className="absolute -right-2 -top-2 h-20 w-20 opacity-30" />

      <section className="animate-fade-up">
        <div className="mb-3 flex items-center gap-2">
          <ScrapWashi />
          <GinghamRibbon />
        </div>
        <p className="text-sm text-ink-muted">
          {greetingForHour()}, {name}
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Tu dinero
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Usa <strong className="text-ink">Sumar</strong>: Gasté o Me entró.
        </p>
      </section>

      <MonthNav month={month} year={year} basePath="/" />

      {isCurrentMonth && (
        <SpendToday
          transactions={data.transactions}
          accounts={data.accounts}
          categories={data.categories}
        />
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" /> Disponible
            </CardDescription>
            <CardTitle className="text-base font-normal">
              {anyConfigured ? (
                <MoneyAmount amount={available} size="lg" />
              ) : (
                <span className="text-base italic text-ink-muted">
                  Configura en Cuentas
                </span>
              )}
            </CardTitle>
          </CardHeader>
          {!anyConfigured && (
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/cuentas">Ir a cuentas</Link>
              </Button>
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Ingresos · {monthNameES(month)}
            </CardDescription>
            <CardTitle className="text-base font-normal">
              <MoneyAmount amount={income} size="lg" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Gastos · {monthNameES(month)}
            </CardDescription>
            <CardTitle className="text-base font-normal">
              <MoneyAmount amount={-expenses} size="lg" signed />
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">
            Registros · {monthNameES(month)}
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/movimientos?month=${month}&year=${year}`}>
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              Nada en {monthNameES(month).toLowerCase()}. Toca{" "}
              <strong>Gasté</strong> o <strong>Me entró</strong>.
            </p>
          ) : (
            <ul className="divide-y divide-rose-dust/15">
              {recent.map((tx) => {
                const isOut = !["income", "crochet_income"].includes(tx.type);
                return (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {tx.description ||
                          tx.category?.name ||
                          TRANSACTION_TYPE_LABELS[tx.type]}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {formatDateES(tx.date)}
                        {tx.category ? ` · ${tx.category.name}` : ""}
                      </p>
                    </div>
                    <MoneyAmount
                      amount={isOut ? -tx.amount : tx.amount}
                      signed
                      size="sm"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddTransactionFab
        accounts={data.accounts}
        categories={data.categories}
        goals={data.goals}
        suggestedBecaAmount={data.profile?.monthly_income_expected ?? 0}
      />
    </div>
  );
}
