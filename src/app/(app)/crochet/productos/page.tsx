import { PageHeader } from "@/components/shared/page-header";
import { ProductsClient } from "@/components/crochet/simple-crud";
import { getAccounts, getCrochetProducts } from "@/lib/data";

export const metadata = { title: "Productos crochet" };

export default async function ProductosPage() {
  const [products, accounts] = await Promise.all([
    getCrochetProducts(),
    getAccounts(),
  ]);
  return (
    <div>
      <PageHeader
        title="Hechos"
        description="Lo que ya tejiste. Cuando vendas, usa Registrar venta para que entre a tu cuenta."
      />
      <ProductsClient products={products} accounts={accounts} />
    </div>
  );
}
