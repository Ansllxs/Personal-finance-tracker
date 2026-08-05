import { cn } from "@/lib/utils";

/** Stubs — ornamentos scrapbook desactivados en el rediseño profesional */
export function FlowerCorner({ className }: { className?: string }) {
  return <span className={cn("hidden", className)} aria-hidden />;
}

export function ScrapWashi({ className }: { className?: string }) {
  return <span className={cn("hidden", className)} aria-hidden />;
}

export function GinghamRibbon({ className }: { className?: string }) {
  return <span className={cn("hidden", className)} aria-hidden />;
}
