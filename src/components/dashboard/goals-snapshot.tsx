"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MoneyAmount } from "@/components/shared/money-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { QuickGoalForm } from "@/components/transactions/quick-goal-form";
import { clampPercent } from "@/lib/utils";
import type { Account, Goal } from "@/lib/types";

export function GoalsSnapshot({
  goals,
  accounts,
}: {
  goals: Goal[];
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [goalId, setGoalId] = useState<string | undefined>();
  const openGoals = goals.filter((g) => !g.is_completed).slice(0, 3);

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4" /> Metas
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/metas">
              Crear <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Crea una meta y aporta desde aquí: se rebaja de tu cuenta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4" /> Metas
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/metas">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {openGoals.map((goal) => {
            const pct = clampPercent(
              (goal.saved_amount / goal.target_amount) * 100
            );
            return (
              <div
                key={goal.id}
                className="rounded-xl bg-cream/80 px-3 py-3"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{goal.name}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setGoalId(goal.id);
                      setOpen(true);
                    }}
                  >
                    Aportar
                  </Button>
                </div>
                <Progress value={pct} />
                <p className="mt-1 text-xs text-ink-muted">
                  <MoneyAmount amount={goal.saved_amount} size="sm" /> de{" "}
                  <MoneyAmount amount={goal.target_amount} size="sm" />
                </p>
              </div>
            );
          })}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setGoalId(undefined);
              setOpen(true);
            }}
          >
            Aporte a meta
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aporte a meta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink-muted">
            El monto se rebaja de la cuenta y suma en la meta.
          </p>
          <QuickGoalForm
            key={goalId ?? "any"}
            accounts={accounts}
            goals={goals}
            defaultGoalId={goalId}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
