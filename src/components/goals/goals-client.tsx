"use client";

import { useState, useTransition } from "react";
import { Gift, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/shared/money-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  convertWishlistToGoal,
  deleteGoal,
  deleteWishlistItem,
  upsertGoal,
  upsertWishlistItem,
} from "@/lib/actions/goals";
import { QuickGoalForm } from "@/components/transactions/quick-goal-form";
import { PRIORITY_LABELS, WISHLIST_STATUS_LABELS } from "@/lib/constants";
import { clampPercent } from "@/lib/utils";
import type {
  Account,
  Goal,
  WishlistItem,
  WishlistPriority,
  WishlistStatus,
} from "@/lib/types";

export function GoalsClient({
  goals,
  wishlist,
  accounts,
}: {
  goals: Goal[];
  wishlist: WishlistItem[];
  accounts: Account[];
}) {
  return (
    <Tabs defaultValue="metas">
      <TabsList>
        <TabsTrigger value="metas">Metas</TabsTrigger>
        <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
      </TabsList>
      <TabsContent value="metas" className="space-y-4">
        <div className="flex justify-end">
          <GoalDialog accounts={accounts} />
        </div>
        {goals.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Sin metas aún"
            description="Crea Viaje a Lisboa, iPad, Televisor u otra meta personal."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                goals={goals}
                accounts={accounts}
              />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="wishlist" className="space-y-4">
        <div className="flex justify-end">
          <WishlistDialog />
        </div>
        {wishlist.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Wishlist vacía"
            description="Anota cositas que quieres, con prioridad y precio estimado."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {wishlist.map((item) => (
              <WishlistCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function GoalCard({
  goal,
  goals,
  accounts,
}: {
  goal: Goal;
  goals: Goal[];
  accounts: Account[];
}) {
  const [pending, startTransition] = useTransition();
  const [contributeOpen, setContributeOpen] = useState(false);
  const pct = clampPercent((goal.saved_amount / goal.target_amount) * 100);

  return (
    <Card className="overflow-hidden lace-edge">
      <div className="h-20 bg-gradient-to-br from-rose-mist via-cream to-lavender/40" />
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{goal.name}</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Eliminar meta ${goal.name}`}
              disabled={pending}
            >
              <Trash2 className="h-4 w-4 text-rose-deep" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar “{goal.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borrará la meta y sus aportes registrados. Esta acción no se
                puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteGoal(goal.id);
                    if (res.error) toast.error(res.error);
                    else toast.success("Meta eliminada");
                  })
                }
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <MoneyAmount amount={goal.saved_amount} size="sm" />
          <span className="text-ink-muted">
            de <MoneyAmount amount={goal.target_amount} size="sm" />
          </span>
        </div>
        <Progress value={pct} />
        <p className="text-xs text-ink-muted">
          {Math.round(pct)}% · El aporte se rebaja de tu cuenta.
        </p>
        {goal.is_completed ? (
          <Badge variant="ok">¡Completada!</Badge>
        ) : (
          <Button
            size="sm"
            className="w-full"
            variant="secondary"
            onClick={() => setContributeOpen(true)}
          >
            Aportar
          </Button>
        )}
      </CardContent>

      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aporte · {goal.name}</DialogTitle>
          </DialogHeader>
          <QuickGoalForm
            key={goal.id}
            accounts={accounts}
            goals={goals}
            defaultGoalId={goal.id}
            onSuccess={() => setContributeOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function GoalDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Nueva meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva meta</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          action={(fd) => {
            startTransition(async () => {
              const res = await upsertGoal({
                name: String(fd.get("name")),
                target_amount: Number(fd.get("target_amount")),
                target_date: String(fd.get("target_date") || "") || null,
                account_id: String(fd.get("account_id") || "") || null,
              });
              if (res.error) toast.error(res.error);
              else {
                toast.success("Meta creada");
                setOpen(false);
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Viaje a Lisboa" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target_amount">Monto objetivo (₡)</Label>
            <Input id="target_amount" name="target_amount" type="number" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target_date">Fecha objetivo (opcional)</Label>
            <Input id="target_date" name="target_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account_id">Sobre / cuenta asociada</Label>
            <select
              id="account_id"
              name="account_id"
              className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              defaultValue=""
            >
              <option value="">Ninguna</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Guardar meta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WishlistDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Agregar deseo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo deseo</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          action={(fd) => {
            startTransition(async () => {
              const res = await upsertWishlistItem({
                name: String(fd.get("name")),
                estimated_price: Number(fd.get("estimated_price") || 0) || null,
                link: String(fd.get("link") || "") || null,
                priority: String(fd.get("priority")) as WishlistPriority,
                status: String(fd.get("status")) as WishlistStatus,
              });
              if (res.error) toast.error(res.error);
              else {
                toast.success("Agregado a wishlist");
                setOpen(false);
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="wname">Producto</Label>
            <Input id="wname" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimated_price">Precio estimado (₡)</Label>
            <Input id="estimated_price" name="estimated_price" type="number" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link">Link (opcional)</Label>
            <Input id="link" name="link" type="url" placeholder="https://" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span>Prioridad</span>
              <select
                name="priority"
                defaultValue="medium"
                className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Estado</span>
              <select
                name="status"
                defaultValue="want"
                className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              >
                {Object.entries(WISHLIST_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const [pending, startTransition] = useTransition();
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-ink-muted">
              {item.estimated_price != null ? (
                <MoneyAmount amount={item.estimated_price} size="sm" />
              ) : (
                "Sin precio"
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge>{PRIORITY_LABELS[item.priority]}</Badge>
            <Badge variant="secondary">
              {WISHLIST_STATUS_LABELS[item.status]}
            </Badge>
          </div>
        </div>
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-rose-deep underline"
          >
            Ver enlace
          </a>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await convertWishlistToGoal(item.id);
                if (res.error) toast.error(res.error);
                else toast.success("Convertido en meta");
              })
            }
          >
            Convertir en meta
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteWishlistItem(item.id);
                if (res.error) toast.error(res.error);
                else toast.success("Eliminado");
              })
            }
          >
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
