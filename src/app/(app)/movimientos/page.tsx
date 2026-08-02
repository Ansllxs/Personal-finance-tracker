import { getAccounts, getCategories, getGoals, getTransactions } from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { AddTransactionFab } from "@/components/transactions/add-transaction-fab";
import { MovimientosHeaderActions } from "@/components/transactions/movimientos-header";
import { TransactionsClient } from "@/components/transactions/transactions-client";

export const metadata = { title: "Movimientos" };

export default async function MovimientosPage() {
  const [transactions, accounts, categories, goals] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
    getGoals(),
  ]);

  return (
    <div className="pb-24">
      <PageHeader
        title="Gastos"
        description="Aquí ves y anotas lo que gastas. También puedes filtrar ingresos u otros."
        actions={
          <MovimientosHeaderActions
            accounts={accounts}
            categories={categories}
          />
        }
      />
      <TransactionsClient
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        goals={goals}
        defaultTypeFilter="expense"
      />
      <AddTransactionFab
        accounts={accounts}
        categories={categories}
        goals={goals}
      />
    </div>
  );
}
