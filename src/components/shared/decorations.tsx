import { cn } from "@/lib/utils";

/** Pequeñas flores SVG originales (sin copyright) */
export function FlowerCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("flower-deco h-16 w-16", className)}
      aria-hidden
    >
      <circle cx="40" cy="40" r="6" fill="#D4A5A5" />
      <ellipse cx="40" cy="22" rx="8" ry="12" fill="#E8C4C4" opacity="0.85" />
      <ellipse cx="40" cy="58" rx="8" ry="12" fill="#E8C4C4" opacity="0.85" />
      <ellipse cx="22" cy="40" rx="12" ry="8" fill="#C5C0D9" opacity="0.75" />
      <ellipse cx="58" cy="40" rx="12" ry="8" fill="#C5C0D9" opacity="0.75" />
      <ellipse
        cx="28"
        cy="28"
        rx="9"
        ry="7"
        fill="#C5D1C0"
        opacity="0.65"
        transform="rotate(-40 28 28)"
      />
      <ellipse
        cx="52"
        cy="52"
        rx="9"
        ry="7"
        fill="#C5D1C0"
        opacity="0.65"
        transform="rotate(-40 52 52)"
      />
    </svg>
  );
}

export function ScrapWashi({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("washi-strip w-28", className)}
    />
  );
}

/** Cinta gingham decorativa (sin copyright) */
export function GinghamRibbon({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-3 w-20 -rotate-2 rounded-sm border border-cornflower/20 bg-gingham opacity-80 shadow-sm",
        className
      )}
    />
  );
}
