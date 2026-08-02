import { PageHeader } from "@/components/shared/page-header";
import { ReportsClient } from "@/components/reports/reports-client";
import {
  getCrochetOrders,
  getCrochetProducts,
  getGoals,
  getTransactions,
} from "@/lib/data";

export const metadata = { title: "Reportes" };

export default async function ReportesPage() {
  const [transactions, goals, orders, products] = await Promise.all([
    getTransactions(),
    getGoals(),
    getCrochetOrders(),
    getCrochetProducts(),
  ]);

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Gráficos simples para ver el panorama personal y del crochet."
      />
      <ReportsClient
        transactions={transactions}
        goals={goals}
        orders={orders}
        products={products}
      />
    </div>
  );
}
