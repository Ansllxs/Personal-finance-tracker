import Link from "next/link";
import { Button } from "@/components/ui/button";
import { monthNameES } from "@/lib/format";

export function MonthNav({
  month,
  year,
  basePath,
}: {
  month: number;
  year: number;
  basePath: string;
}) {
  const prev =
    month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next =
    month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

  const path = basePath.split("?")[0];
  const link = (m: number, y: number) => `${path}?month=${m}&year=${y}`;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={link(prev.month, prev.year)} aria-label="Mes anterior">
          ←
        </Link>
      </Button>
      <p className="min-w-[9rem] text-center font-display text-lg font-semibold">
        {monthNameES(month)} {year}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href={link(next.month, next.year)} aria-label="Mes siguiente">
          →
        </Link>
      </Button>
    </div>
  );
}
