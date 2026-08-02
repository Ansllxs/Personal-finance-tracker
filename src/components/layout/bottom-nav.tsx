"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Home,
  Menu,
  PieChart,
  Scissors,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  Home,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Sparkles,
  Scissors,
  Settings,
  Menu,
} as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-dust/20 bg-paper/95 pb-safe backdrop-blur-md lg:hidden"
      aria-label="Navegación móvil"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-7 px-0.5 pt-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 text-[9px] font-medium leading-tight",
                  active ? "text-rose-deep" : "text-ink-muted"
                )}
                aria-current={active ? "page" : undefined}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
