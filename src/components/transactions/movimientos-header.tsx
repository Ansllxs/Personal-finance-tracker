"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QuickExpenseForm } from "./quick-expense-form";
import type { Account, Category } from "@/lib/types";

export function MovimientosHeaderActions({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="h-11" onClick={() => setOpen(true)}>
        Anotar gasto
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Registrar gasto</SheetTitle>
            <SheetDescription>
              Lo que vas gastando, sin complicaciones.
            </SheetDescription>
          </SheetHeader>
          <QuickExpenseForm
            accounts={accounts}
            categories={categories}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
