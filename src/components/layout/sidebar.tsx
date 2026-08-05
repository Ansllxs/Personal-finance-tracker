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
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ink/8 lg:bg-paper">
      <div className="border-b border-ink/8 px-5 py-6">
        <p className="text-xl font-semibold leading-tight tracking-tight text-ink">
          {APP_NAME}
        </p>
        <p className="mt-1 text-xs text-ink-muted">Tus finanzas · ₡</p>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
      <div className="mx-4 mb-6 rounded-lg border border-ink/8 bg-cream px-3 py-3 text-xs text-ink-muted">
        Finance Tracker · ₡
      </div>
    </aside>
  );
}
