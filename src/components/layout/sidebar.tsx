"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Home,
  Menu,
  PieChart,
  Scissors,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FlowerCorner } from "@/components/shared/decorations";

const ICONS = {
  Home,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Sparkles,
  Scissors,
  BarChart3,
  Settings,
  Menu,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-rose-dust/20 lg:bg-paper/80 lg:backdrop-blur-md">
      <div className="relative border-b border-rose-dust/15 px-5 py-6">
        <FlowerCorner className="absolute -right-1 -top-1 h-14 w-14 opacity-40" />
        <p className="font-display text-xl font-semibold leading-tight text-rose-deep">
          {APP_NAME}
        </p>
        <p className="mt-1 text-xs text-ink-muted">Registro simple · ₡</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-rose-mist text-rose-deep"
                  : "text-ink-muted hover:bg-cream hover:text-ink"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="lace-edge mx-4 mb-6 rounded-xl bg-gingham px-3 py-3 text-xs text-ink-muted">
        Hecho con calma · ₡
      </div>
    </aside>
  );
}
