import { PageHeader } from "@/components/shared/page-header";
import { OrdersClient } from "@/components/crochet/orders-client";
import {
  getAccounts,
  getCrochetCustomers,
  getCrochetOrders,
  getCrochetProducts,
} from "@/lib/data";

export const metadata = { title: "Pedidos crochet" };

export default async function PedidosPage() {
  const [orders, customers, products, accounts] = await Promise.all([
    getCrochetOrders(),
    getCrochetCustomers(),
    getCrochetProducts(),
    getAccounts(),
  ]);

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Encargos: precio, cuánto te han pagado y cuánto falta. Para que entre a tu cuenta, usa Registrar pago."
      />
      <OrdersClient
        orders={orders}
        customers={customers}
        products={products}
        accounts={accounts}
      />
    </div>
  );
}
