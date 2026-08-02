import { PageHeader } from "@/components/shared/page-header";
import { CustomersClient } from "@/components/crochet/simple-crud";
import { getCrochetCustomers, getCrochetOrders } from "@/lib/data";

export const metadata = { title: "Clientes crochet" };

export default async function ClientesPage() {
  const [customers, orders] = await Promise.all([
    getCrochetCustomers(),
    getCrochetOrders(),
  ]);

  const totals: Record<string, number> = {};
  for (const o of orders) {
    if (!o.customer_id) continue;
    totals[o.customer_id] = (totals[o.customer_id] ?? 0) + o.agreed_price;
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Personas que te encargan crochet, con su total comprado."
      />
      <CustomersClient customers={customers} orderTotals={totals} />
    </div>
  );
}
