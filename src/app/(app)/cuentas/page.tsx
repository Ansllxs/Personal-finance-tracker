import { PageHeader } from "@/components/shared/page-header";
import { AccountsClient } from "@/components/accounts/accounts-client";
import {
  getAccounts,
  getCreditCards,
  getTransactions,
} from "@/lib/data";
import { enrichAccounts, enrichCreditCards } from "@/lib/finance";

export const metadata = { title: "Cuentas" };

export default async function CuentasPage() {
  const [accounts, cards, transactions] = await Promise.all([
    getAccounts(),
    getCreditCards(),
    getTransactions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Cuentas y tarjeta"
        description="Pon cuánto tienes ahora. Cada mes se mueve con lo que registres. Edita lo que quieras."
      />
      <AccountsClient
        accounts={enrichAccounts(accounts, transactions)}
        cards={enrichCreditCards(cards, accounts, transactions)}
        transactions={transactions}
      />
    </div>
  );
}
