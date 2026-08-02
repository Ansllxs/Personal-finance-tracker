import { formatCRC, formatCRCSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyAmountProps {
  amount: number | null | undefined;
  signed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  emptyLabel?: string;
}

export function MoneyAmount({
  amount,
  signed = false,
  size = "md",
  className,
  emptyLabel = "Por configurar",
}: MoneyAmountProps) {
  if (amount === null || amount === undefined) {
    return (
      <span
        className={cn(
          "font-medium text-ink-muted italic",
          size === "xl" && "text-2xl",
          size === "lg" && "text-xl",
          size === "sm" && "text-sm",
          className
        )}
      >
        {emptyLabel}
      </span>
    );
  }

  const negative = amount < 0;
  const positive = amount > 0 && signed;

  return (
    <span
      className={cn(
        "font-semibold tabular-nums tracking-tight",
        size === "xl" && "text-3xl md:text-4xl",
        size === "lg" && "text-xl md:text-2xl",
        size === "md" && "text-base",
        size === "sm" && "text-sm",
        negative && "text-rose-deep",
        positive && "text-[color:var(--sage)] dark:text-sage",
        !negative && !positive && "text-ink",
        className
      )}
      aria-label={
        negative
          ? `Gasto o egreso de ${formatCRC(Math.abs(amount))}`
          : formatCRC(amount)
      }
    >
      {negative && (
        <span className="mr-1 inline-block text-xs font-medium uppercase tracking-wide text-rose-deep/80">
          egreso
        </span>
      )}
      {signed ? formatCRCSigned(amount) : formatCRC(amount)}
    </span>
  );
}
