import { PageHeader } from "@/components/shared/page-header";
import { BudgetClient } from "@/components/budget/budget-client";
import { getBudget, getCategories, getTransactions } from "@/lib/data";
import { suggestedBudgetSplit } from "@/lib/constants";

export const metadata = { title: "Presupuesto" };

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = Number(sp.month) || now.getMonth() + 1;
  const year = Number(sp.year) || now.getFullYear();

  const [{ budget, items }, categories, transactions] = await Promise.all([
    getBudget(month, year),
    getCategories(),
    getTransactions(),
  ]);

  const suggestion = suggestedBudgetSplit(budget?.expected_income ?? 295000);

  return (
    <div>
      <PageHeader
        title="Presupuesto"
        description="Asigna tu ingreso esperado por categoría. Todo es editable; la sugerencia 50/30/20 es solo una guía amable."
      />
      <BudgetClient
        month={month}
        year={year}
        budget={budget}
        items={items}
        categories={categories.filter(
          (c) => c.type === "expense" && c.scope !== "crochet"
        )}
        transactions={transactions}
        suggestion={suggestion}
      />
    </div>
  );
}
