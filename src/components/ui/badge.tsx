import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-rose-mist text-rose-deep",
        secondary: "border-transparent bg-lavender/15 text-ink",
        sage: "border-transparent bg-sage/25 text-ink",
        outline: "border-ink/15 text-ink",
        ok: "border-transparent bg-sage/30 text-ink",
        near: "border-transparent bg-amber-soft text-ink",
        over: "border-transparent bg-rose-mist text-rose-deep",
        pending: "border-dashed border-ink/20 text-ink-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
