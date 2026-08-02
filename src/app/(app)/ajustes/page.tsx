import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/components/settings/settings-client";
import { getCategories, getProfile } from "@/lib/data";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const [profile, categories] = await Promise.all([
    getProfile(),
    getCategories(),
  ]);

  return (
    <div>
      <PageHeader
        title="Más"
        description="Cómo usar la app, categorías, y extras opcionales."
      />
      <SettingsClient profile={profile} categories={categories} />
    </div>
  );
}
