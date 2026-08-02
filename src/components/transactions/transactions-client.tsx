"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MoneyAmount } from "@/components/shared/money-amount";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import {
  deleteTransaction,
  duplicateTransaction,
} from "@/lib/actions/transactions";
import { formatDateES } from "@/lib/format";
import type {
  Account,
  Category,
  Goal,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { TransactionForm } from "./transaction-form";

export function TransactionsClient({
  transactions,
  accounts,
  categories,
  goals,
  defaultTypeFilter = "all",
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  defaultTypeFilter?: string;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>(defaultTypeFilter);
  const [tag, setTag] = useState<string>("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (type !== "all" && tx.type !== type) return false;
      if (tag !== "all" && tx.tag !== tag) return false;
      if (q) {
        const hay = `${tx.description ?? ""} ${tx.category?.name ?? ""} ${tx.account?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [transactions, q, type, tag]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar descripción, categoría…"
            className="pl-9"
            aria-label="Buscar movimientos"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
          aria-label="Filtrar por tipo"
        >
          <option value="all">Todos los tipos</option>
          {(Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map(
            (t) => (
              <option key={t} value={t}>
                {TRANSACTION_TYPE_LABELS[t]}
              </option>
            )
          )}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="h-11 rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
          aria-label="Filtrar por etiqueta"
        >
          <option value="all">Personal + Crochet</option>
          <option value="personal">Solo personal</option>
          <option value="crochet">Solo crochet</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin movimientos"
          description="Prueba otro filtro o agrega un movimiento con el botón flotante."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-rose-dust/20 bg-paper">
          <ul className="divide-y divide-rose-dust/15">
            {filtered.map((tx) => {
              const isOut = ![
                "income",
                "crochet_income",
              ].includes(tx.type);
              return (
                <li
                  key={tx.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {tx.description || TRANSACTION_TYPE_LABELS[tx.type]}
                      </p>
                      <Badge variant="outline">
                        {TRANSACTION_TYPE_LABELS[tx.type]}
                      </Badge>
                      <Badge variant={tx.tag === "crochet" ? "sage" : "secondary"}>
                        {tx.tag === "crochet" ? "Crochet" : "Personal"}
                      </Badge>
                      {tx.status === "pending" && (
                        <Badge variant="pending">Pendiente</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatDateES(tx.date)}
                      {tx.category ? ` · ${tx.category.name}` : ""}
                      {tx.account ? ` · ${tx.account.name}` : ""}
                      {tx.to_account ? ` → ${tx.to_account.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MoneyAmount
                      amount={isOut ? -tx.amount : tx.amount}
                      signed
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar"
                      onClick={() => setEditing(tx)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Duplicar"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await duplicateTransaction(tx.id);
                          if (res.error) toast.error(res.error);
                          else toast.success("Movimiento duplicado");
                        })
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Eliminar">
                          <Trash2 className="h-4 w-4 text-rose-deep" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Los saldos se recalcularán.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              startTransition(async () => {
                                const res = await deleteTransaction(tx.id);
                                if (res.error) toast.error(res.error);
                                else toast.success("Eliminado");
                              })
                            }
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar movimiento</DialogTitle>
          </DialogHeader>
          {editing && (
            <TransactionForm
              accounts={accounts}
              categories={categories}
              goals={goals}
              initial={editing}
              onSuccess={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
