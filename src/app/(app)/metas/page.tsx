import { PageHeader } from "@/components/shared/page-header";
import { GoalsClient } from "@/components/goals/goals-client";
import { getAccounts, getGoals, getWishlist } from "@/lib/data";

export const metadata = { title: "Metas y Wishlist" };

export default async function MetasPage() {
  const [goals, wishlist, accounts] = await Promise.all([
    getGoals(),
    getWishlist(),
    getAccounts(),
  ]);

  return (
    <div>
      <PageHeader
        title="Metas y Wishlist"
        description="Guarda con cariño hacia Lisboa, el iPad, el televisor… o lo que sueñes después."
      />
      <GoalsClient goals={goals} wishlist={wishlist} accounts={accounts} />
    </div>
  );
}
