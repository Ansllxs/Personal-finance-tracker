import { PageHeader } from "@/components/shared/page-header";
import { ProductsClient } from "@/components/crochet/simple-crud";
import { getCrochetProducts } from "@/lib/data";

export const metadata = { title: "Productos crochet" };

export default async function ProductosPage() {
  const products = await getCrochetProducts();
  return (
    <div>
      <PageHeader
        title="Hechos"
        description="Lo que ya tejiste y tienes listo. Cuando termines uno, agrégalo o dale +1."
      />
      <ProductsClient products={products} />
    </div>
  );
}
