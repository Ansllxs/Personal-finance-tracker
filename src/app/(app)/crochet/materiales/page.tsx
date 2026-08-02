import { PageHeader } from "@/components/shared/page-header";
import { MaterialsClient } from "@/components/crochet/simple-crud";
import { getCrochetMaterials } from "@/lib/data";

export const metadata = { title: "Materiales crochet" };

export default async function MaterialesPage() {
  const materials = await getCrochetMaterials();
  return (
    <div>
      <PageHeader
        title="Materiales e inventario"
        description="Recibirás alerta visual cuando un material esté en o bajo su nivel mínimo."
      />
      <MaterialsClient materials={materials} />
    </div>
  );
}
