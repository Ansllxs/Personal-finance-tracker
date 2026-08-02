"use client";

import { useMemo, useState, useTransition } from "react";
import { CreditCard, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { MoneyAmount } from "@/components/shared/money-amount";
import { EmptyState } from "@/components/shared/empty-state";
import { InfoTip } from "@/components/shared/info-tip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAccount,
  setCurrentBalance,
  upsertAccount,
  upsertCreditCard,
} from "@/lib/actions/accounts";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatCRC, formatDateES, monthNameES } from "@/lib/format";
import { accountMonthFlow, nextCardDate } from "@/lib/finance";
import { toISODate } from "@/lib/utils";
import type {
  AccountType,
  AccountWithBalance,
  CreditCardSummary,
  Transaction,
} from "@/lib/types";

export function AccountsClient({
  accounts,
  cards,
  transactions,
}: {
  accounts: AccountWithBalance[];
  cards: CreditCardSummary[];
  transactions: Transaction[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const cashAccounts = accounts.filter((a) => a.type !== "credit_card");
  const cardPayments = transactions.filter((t) => t.type === "card_payment");

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Pon cuánto tienes ahora en cada cuenta. Este mes ({monthNameES(month)})
        se actualiza solo con lo que registres.
      </p>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nueva cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva cuenta</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              action={(fd) => {
                startTransition(async () => {
                  const res = await upsertAccount({
                    name: String(fd.get("name")),
                    type: String(fd.get("type")) as AccountType,
                    initial_balance: Number(fd.get("current_balance") || 0),
                    color: String(fd.get("color") || "#D4A5A5"),
                    icon: "wallet",
                    configureBalance: true,
                  });
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Cuenta creada");
                    setOpen(false);
                  }
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Ej. BAC, efectivo en casa…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                  defaultValue="bank"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-ink-muted">
                  SINPE no es una cuenta: es cómo te pagan o pagas, desde el banco.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="current_balance">¿Cuánto tienes ahora? (₡)</Label>
                <Input
                  id="current_balance"
                  name="current_balance"
                  type="number"
                  defaultValue={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" type="color" defaultValue="#D4A5A5" />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin cuentas todavía"
          description="Crea tu cuenta del banco y efectivo. Tú defines los montos."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cashAccounts.map((account) => {
            const flow = accountMonthFlow(account.id, transactions, year, month);
            return (
              <Card key={account.id} className="overflow-hidden">
                <div
                  className="h-1.5"
                  style={{ background: account.color }}
                  aria-hidden
                />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="truncate">{account.name}</span>
                    <Badge variant="outline">
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-ink-muted">Tienes ahora</p>
                    <MoneyAmount amount={account.balance} size="lg" />
                  </div>
                  <div className="rounded-xl bg-cream/80 px-3 py-2 text-sm">
                    <p className="text-xs font-medium text-ink-muted">
                      Este mes · {monthNameES(month)}
                    </p>
                    <div className="mt-1 flex justify-between gap-2">
                      <span className="text-ink">
                        Entró {formatCRC(flow.in)}
                      </span>
                      <span className="text-rose-deep">
                        Salió {formatCRC(flow.out)}
                      </span>
                    </div>
                  </div>
                  <EditAccountDialog account={account} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-lavender" />
          Tarjeta de crédito
        </h2>
        {cards.length === 0 ? (
          <EmptyState
            title="Sin tarjeta configurada"
            description="Crea una cuenta de tipo tarjeta cuando quieras."
          />
        ) : (
          cards.map((card) => {
            const due = nextCardDate(card.payment_due_day, today);
            const alertSoon =
              due &&
              (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 5;

            return (
              <Card
                key={card.id}
                className={alertSoon ? "border-rose-dust bg-rose-mist/30" : ""}
              >
                <CardHeader>
                  <CardTitle className="text-base">
                    {card.account?.name ?? "Tarjeta"}
                    {alertSoon && (
                      <Badge variant="over" className="ml-2">
                        Pago pronto
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <InfoRow
                      label="Deuda actual"
                      tip="Se calcula con la deuda que pongas + gastos con tarjeta − pagos."
                      value={<MoneyAmount amount={card.debt} />}
                    />
                    <InfoRow
                      label="Límite"
                      value={
                        card.credit_limit != null ? (
                          <MoneyAmount amount={card.credit_limit} />
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      label="Disponible"
                      value={
                        card.available != null ? (
                          <MoneyAmount amount={card.available} />
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      label="Pago mínimo"
                      value={
                        card.minimum_payment != null ? (
                          <MoneyAmount amount={card.minimum_payment} />
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      label="Fecha de corte"
                      tip="Día en que cierra el estado de cuenta."
                      value={
                        card.statement_day
                          ? `Día ${card.statement_day}`
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Fecha máxima de pago"
                      tip="Último día para pagar sin caer en mora."
                      value={
                        card.payment_due_day
                          ? `Día ${card.payment_due_day}${
                              due ? ` · ${formatDateES(toISODate(due))}` : ""
                            }`
                          : "—"
                      }
                    />
                  </div>

                  <CardDetailsForm card={card} />

                  <div>
                    <h3 className="mb-2 text-sm font-medium">Historial de pagos</h3>
                    {cardPayments.filter((p) => p.to_account_id === card.account_id)
                      .length === 0 ? (
                      <p className="text-sm text-ink-muted">
                        Aún no hay pagos. Regístralos en Gastos como “Pago de tarjeta”.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {cardPayments
                          .filter((p) => p.to_account_id === card.account_id)
                          .slice(0, 5)
                          .map((p) => (
                            <li
                              key={p.id}
                              className="flex justify-between rounded-lg bg-cream px-3 py-2"
                            >
                              <span>{formatDateES(p.date)}</span>
                              <MoneyAmount amount={p.amount} size="sm" />
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}

function EditAccountDialog({ account }: { account: AccountWithBalance }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full">
          <Pencil className="h-3.5 w-3.5" /> Editar / poner saldo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {account.name}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          action={(fd) => {
            startTransition(async () => {
              const name = String(fd.get("name"));
              const type = String(fd.get("type")) as AccountType;
              const color = String(fd.get("color") || account.color);
              const current = Number(fd.get("current_balance") || 0);

              const meta = await upsertAccount({
                id: account.id,
                name,
                type,
                initial_balance: account.initial_balance,
                color,
                icon: account.icon,
                configureBalance: true,
              });
              if (meta.error) {
                toast.error(meta.error);
                return;
              }

              const bal = await setCurrentBalance(account.id, current);
              if (bal.error) toast.error(bal.error);
              else {
                toast.success("Cuenta actualizada");
                setOpen(false);
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`name-${account.id}`}>Nombre</Label>
            <Input
              id={`name-${account.id}`}
              name="name"
              required
              defaultValue={account.name}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`type-${account.id}`}>Tipo</Label>
            <select
              id={`type-${account.id}`}
              name="type"
              className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              defaultValue={account.type}
            >
              {Object.entries(ACCOUNT_TYPE_LABELS)
                .filter(([k]) => k !== "credit_card")
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`bal-${account.id}`}>¿Cuánto tienes ahora? (₡)</Label>
            <Input
              id={`bal-${account.id}`}
              name="current_balance"
              type="number"
              defaultValue={account.balance}
            />
            <p className="text-xs text-ink-muted">
              Si estás en cero, pon 0. Los gastos e ingresos del mes siguen contando.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`color-${account.id}`}>Color</Label>
            <Input
              id={`color-${account.id}`}
              name="color"
              type="color"
              defaultValue={account.color}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Guardar cambios
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-rose-deep"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteAccount(account.id);
              if (res.error) toast.error(res.error);
              else {
                toast.success("Cuenta eliminada");
                setOpen(false);
              }
            })
          }
        >
          <Trash2 className="h-4 w-4" /> Eliminar cuenta
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CardDetailsForm({ card }: { card: CreditCardSummary }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-3 rounded-xl bg-cream/80 p-3 sm:grid-cols-2"
      action={(fd) => {
        startTransition(async () => {
          const debtRaw = String(fd.get("current_debt") ?? "");
          const res = await upsertCreditCard({
            id: card.id,
            account_id: card.account_id,
            credit_limit: numOrNull(fd.get("credit_limit")),
            statement_day: numOrNull(fd.get("statement_day")),
            payment_due_day: numOrNull(fd.get("payment_due_day")),
            minimum_payment: numOrNull(fd.get("minimum_payment")),
            interest_rate: numOrNull(fd.get("interest_rate")),
            current_debt: debtRaw === "" ? null : Number(debtRaw),
          });
          if (res.error) toast.error(res.error);
          else toast.success("Tarjeta actualizada");
        });
      }}
    >
      <Field
        name="current_debt"
        label="Deuda actual (₡)"
        defaultValue={String(card.debt)}
        placeholder="0"
      />
      <Field
        name="credit_limit"
        label="Límite (₡)"
        defaultValue={card.credit_limit?.toString() ?? ""}
      />
      <Field
        name="minimum_payment"
        label="Pago mínimo (₡)"
        defaultValue={card.minimum_payment?.toString() ?? ""}
      />
      <Field
        name="interest_rate"
        label="Tasa interés % (opcional)"
        defaultValue={card.interest_rate?.toString() ?? ""}
      />
      <Field
        name="statement_day"
        label="Día de corte (1-31)"
        defaultValue={card.statement_day?.toString() ?? ""}
      />
      <Field
        name="payment_due_day"
        label="Día máx. de pago (1-31)"
        defaultValue={card.payment_due_day?.toString() ?? ""}
      />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          Guardar datos de tarjeta
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-ink-muted">{label}</span>
      <Input
        name={name}
        type="number"
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}

function InfoRow({
  label,
  value,
  tip,
}: {
  label: string;
  value: React.ReactNode;
  tip?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-paper px-3 py-2">
      <span className="inline-flex items-center gap-1 text-ink-muted">
        {label}
        {tip && <InfoTip text={tip} />}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function numOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
