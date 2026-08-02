"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import { upsertTransaction } from "@/lib/actions/transactions";
import { toISODate } from "@/lib/utils";
import type {
  Account,
  Category,
  Goal,
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@/lib/types";

const TYPES: TransactionType[] = [
  "expense",
  "income",
  "transfer",
  "card_payment",
  "goal_contribution",
  "crochet_income",
  "crochet_expense",
];

interface Props {
  accounts: Account[];
  categories: Category[];
  goals?: Goal[];
  initial?: Partial<Transaction>;
  onSuccess?: () => void;
  defaultType?: TransactionType;
}

export function TransactionForm({
  accounts,
  categories,
  goals = [],
  initial,
  onSuccess,
  defaultType = "expense",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<TransactionType>(
    initial?.type ?? defaultType
  );
  const [tag, setTag] = useState<"personal" | "crochet">(
    initial?.tag ??
      (defaultType.startsWith("crochet") ? "crochet" : "personal")
  );

  const filteredCategories = useMemo(() => {
    if (type === "income") {
      return categories.filter((c) => c.type === "income");
    }
    if (type === "crochet_income" || type === "crochet_expense") {
      return categories.filter((c) => c.scope === "crochet" || c.scope === "both");
    }
    if (type === "expense") {
      return categories.filter((c) => c.type === "expense" && c.scope !== "crochet");
    }
    return categories;
  }, [categories, type]);

  const creditCards = accounts.filter((a) => a.type === "credit_card");
  const cashAccounts = accounts.filter((a) => a.type !== "credit_card");

  function handleSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"));
    startTransition(async () => {
      const result = await upsertTransaction({
        id: initial?.id,
        date: String(formData.get("date")),
        type,
        amount,
        category_id: (formData.get("category_id") as string) || null,
        account_id: (formData.get("account_id") as string) || null,
        to_account_id: (formData.get("to_account_id") as string) || null,
        goal_id: (formData.get("goal_id") as string) || null,
        description: String(formData.get("description") || "") || null,
        payment_method:
          (String(formData.get("payment_method") || "") as PaymentMethod) ||
          null,
        tag:
          type.startsWith("crochet")
            ? "crochet"
            : (tag as "personal" | "crochet"),
        status: (formData.get("status") as "confirmed" | "pending") || "confirmed",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(initial?.id ? "Movimiento actualizado" : "Movimiento guardado");
      onSuccess?.();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              if (t.startsWith("crochet")) setTag("crochet");
              else if (t !== "transfer") setTag("personal");
            }}
            className={`rounded-xl border px-2 py-2.5 text-left text-xs font-medium transition-colors ${
              type === t
                ? "border-rose-dust bg-rose-mist text-rose-deep"
                : "border-rose-dust/20 bg-paper text-ink-muted"
            }`}
          >
            {TRANSACTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Monto (₡)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            defaultValue={initial?.amount ?? ""}
            placeholder="295000"
            className="h-12 text-lg font-semibold tabular-nums"
            autoFocus={!initial?.id}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? toISODate(new Date())}
            className="h-12"
          />
        </div>
      </div>

      {(type === "expense" ||
        type === "income" ||
        type === "crochet_income" ||
        type === "crochet_expense") && (
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Categoría</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm text-ink"
          >
            <option value="">Elegir categoría</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === "transfer" || type === "card_payment" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AccountSelect
            label={type === "card_payment" ? "Pagar desde" : "Cuenta origen"}
            name="account_id"
            accounts={cashAccounts}
            defaultValue={initial?.account_id}
          />
          <AccountSelect
            label={type === "card_payment" ? "Tarjeta" : "Cuenta destino"}
            name="to_account_id"
            accounts={type === "card_payment" ? creditCards : accounts}
            defaultValue={initial?.to_account_id}
          />
        </div>
      ) : (
        <AccountSelect
          label={
            type.includes("expense") || type === "goal_contribution"
              ? "Cuenta"
              : "Cuenta destino"
          }
          name="account_id"
          accounts={
            type === "expense"
              ? accounts
              : cashAccounts
          }
          defaultValue={initial?.account_id}
          hint={
            type === "expense"
              ? "Si eliges tarjeta, aumenta la deuda. SINPE = banco."
              : undefined
          }
        />
      )}

      {(type === "expense" ||
        type === "income" ||
        type === "crochet_income" ||
        type === "crochet_expense") && (
        <div className="space-y-1.5">
          <Label htmlFor="payment_method">
            {type.includes("income") ? "¿Cómo te pagaron?" : "¿Cómo pagaste?"}
          </Label>
          <select
            id="payment_method"
            name="payment_method"
            defaultValue={initial?.payment_method ?? ""}
            className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm text-ink"
          >
            <option value="">Sin especificar</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
              (m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {type === "goal_contribution" && (
        <div className="space-y-1.5">
          <Label>Meta</Label>
          <NativeSelect
            name="goal_id"
            defaultValue={initial?.goal_id ?? ""}
            required
            options={goals.map((g) => ({ value: g.id, label: g.name }))}
          />
        </div>
      )}

      {!type.startsWith("crochet") && type !== "transfer" && (
        <div className="space-y-1.5">
          <Label htmlFor="tag">Etiqueta</Label>
          <select
            id="tag"
            value={tag}
            onChange={(e) => setTag(e.target.value as "personal" | "crochet")}
            className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm text-ink"
          >
            <option value="personal">Personal</option>
            <option value="crochet">Crochet</option>
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initial?.description ?? ""}
          placeholder="Ej. Supermercado / Adelanto pedido flor"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Estado</Label>
        <NativeSelect
          name="status"
          defaultValue={initial?.status ?? "confirmed"}
          options={[
            { value: "confirmed", label: "Confirmado" },
            { value: "pending", label: "Pendiente" },
          ]}
        />
      </div>

      <Button type="submit" className="h-12 w-full" disabled={pending}>
        {pending ? "Guardando…" : initial?.id ? "Guardar cambios" : "Agregar movimiento"}
      </Button>
    </form>
  );
}

function NativeSelect({
  name,
  options,
  defaultValue,
  value,
  onChange,
  required,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      required={required}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm text-ink"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function AccountSelect({
  label,
  name,
  accounts,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  accounts: Account[];
  defaultValue?: string | null;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue ?? ""}
        className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm text-ink"
      >
        <option value="" disabled>
          Seleccionar
        </option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

