import {
  getAccounts,
  getCategories,
  getGoals,
  getProfile,
  getTransactions,
} from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { MonthNav } from "@/components/shared/month-nav";
import { AddTransactionFab } from "@/components/transactions/add-transaction-fab";
import { MovimientosHeaderActions } from "@/components/transactions/movimientos-header";
import { TransactionsClient } from "@/components/transactions/transactions-client";
import { endOfMonth, startOfMonth, toISODate } from "@/lib/utils";

export const metadata = { title: "Movimientos" };

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = Number(sp.month) || now.getMonth() + 1;
  const year = Number(sp.year) || now.getFullYear();
  const from = toISODate(startOfMonth(new Date(year, month - 1, 1)));
  const to = toISODate(endOfMonth(new Date(year, month - 1, 1)));

  const [transactions, accounts, categories, goals, profile] =
    await Promise.all([
      getTransactions(),
      getAccounts(),
      getCategories(),
      getGoals(),
      getProfile(),
    ]);

  return (
    <div className="pb-24">
      <PageHeader
        title="Gastos"
        description="Lo del mes. Cambia de mes arriba o filtra por tipo."
        actions={
          <MovimientosHeaderActions
            accounts={accounts}
            categories={categories}
          />
        }
      />
      <div className="mb-4">
        <MonthNav month={month} year={year} basePath="/movimientos" />
      </div>
      <TransactionsClient
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        goals={goals}
        defaultTypeFilter="expense"
        from={from}
        to={to}
      />
      <AddTransactionFab
        accounts={accounts}
        categories={categories}
        goals={goals}
        suggestedBecaAmount={profile?.monthly_income_expected ?? 0}
      />
    </div>
  );
}
