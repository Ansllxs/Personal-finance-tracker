import { PageHeader } from "@/components/shared/page-header";
import { CrochetFinanceClient } from "@/components/crochet/finance-client";
import {
  getAccounts,
  getCrochetOrders,
  getTransactions,
} from "@/lib/data";
import { orderBalance, sumByType } from "@/lib/finance";
import { endOfMonth, startOfMonth, toISODate } from "@/lib/utils";

export const metadata = { title: "Finanzas crochet" };

export default async function CrochetFinanzasPage() {
  const [transactions, orders, accounts] = await Promise.all([
    getTransactions(),
    getCrochetOrders(),
    getAccounts(),
  ]);

  const now = new Date();
  const from = toISODate(startOfMonth(now));
  const to = toISODate(endOfMonth(now));

  const sales = sumByType(transactions, ["crochet_income"], { from, to });
  const materialExpenses = transactions
    .filter(
      (t) =>
        t.type === "crochet_expense" &&
        t.date >= from &&
        t.date <= to &&
        t.status === "confirmed" &&
        (t.category?.name === "Materiales" || t.category?.name === "Herramientas")
    )
    .reduce((s, t) => s + t.amount, 0);

  const packagingShipping = transactions
    .filter(
      (t) =>
        t.type === "crochet_expense" &&
        t.date >= from &&
        t.date <= to &&
        t.status === "confirmed" &&
        (t.category?.name === "Empaques" || t.category?.name === "Envíos")
    )
    .reduce((s, t) => s + t.amount, 0);

  const allExpenses = sumByType(transactions, ["crochet_expense"], { from, to });
  const netProfit = sales - allExpenses;
  const pendingPayments = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + orderBalance(o), 0);

  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mFrom = toISODate(startOfMonth(d));
    const mTo = toISODate(endOfMonth(d));
    return {
      month: d.getMonth() + 1,
      total: sumByType(transactions, ["crochet_income"], {
        from: mFrom,
        to: mTo,
      }),
    };
  });

  return (
    <div>
      <PageHeader
        title="Finanzas del emprendimiento"
        description="Ventas, costos y utilidad del crochet, separados del día a día personal."
      />
      <CrochetFinanceClient
        sales={sales}
        materialExpenses={materialExpenses}
        packagingShipping={packagingShipping}
        netProfit={netProfit}
        pendingPayments={pendingPayments}
        monthlySales={monthlySales}
        accounts={accounts}
      />
    </div>
  );
}
