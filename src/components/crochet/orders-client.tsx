"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/shared/money-amount";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteOrder,
  registerOrderPayment,
  upsertOrder,
} from "@/lib/actions/crochet";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { orderBalance } from "@/lib/finance";
import { toISODate } from "@/lib/utils";
import type {
  Account,
  CrochetCustomer,
  CrochetOrder,
  CrochetProduct,
  OrderStatus,
  PaymentMethod,
} from "@/lib/types";

type OrderFilter = "all" | "por_cobrar" | "activos" | OrderStatus;

export function OrdersClient({
  orders,
  customers,
  products,
  accounts,
}: {
  orders: CrochetOrder[];
  customers: CrochetCustomer[];
  products: CrochetProduct[];
  accounts: Account[];
}) {
  const [editing, setEditing] = useState<CrochetOrder | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("activos");
  const [pending, startTransition] = useTransition();

  const filtered = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "por_cobrar") {
      return (
        orderBalance(order) > 0 &&
        order.status !== "cancelado"
      );
    }
    if (filter === "activos") {
      return ["consulta", "confirmado", "en_proceso", "listo"].includes(
        order.status
      );
    }
    return order.status === filter;
  });

  const filters: { key: OrderFilter; label: string }[] = [
    { key: "activos", label: "Activos" },
    { key: "por_cobrar", label: "Por cobrar" },
    { key: "all", label: "Todos" },
    { key: "en_proceso", label: "En proceso" },
    { key: "listo", label: "Listo" },
    { key: "entregado", label: "Entregado" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OrderDialog customers={customers} products={products} />
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              filter === f.key
                ? "border-rose-dust bg-rose-mist text-rose-deep"
                : "border-rose-dust/20 bg-paper text-ink-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState
          title="Sin pedidos"
          description="Registra un encargo. Cuando te paguen, usa Registrar pago para que sume en tu cuenta."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nada en este filtro"
          description="Prueba otro filtro o crea un pedido."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{order.description}</p>
                    <p className="text-xs text-ink-muted">
                      {order.customer?.name ?? "Sin cliente"}
                      {order.product ? ` · ${order.product.name}` : ""}
                      {order.delivery_date
                        ? ` · entrega ${order.delivery_date}`
                        : ""}
                    </p>
                  </div>
                  <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-ink-muted">Precio</p>
                    <MoneyAmount amount={order.agreed_price} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Ya cobrado</p>
                    <MoneyAmount amount={order.advance_received} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Por cobrar</p>
                    <MoneyAmount amount={orderBalance(order)} size="sm" />
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted">
                  La plata solo entra a tu cuenta con{" "}
                  <strong className="font-medium text-ink">Registrar pago</strong>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(order)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <PaymentDialog order={order} accounts={accounts} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" disabled={pending}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-deep" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se borrará “{order.description}”. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            startTransition(async () => {
                              const res = await deleteOrder(order.id);
                              if (res.error) toast.error(res.error);
                              else toast.success("Pedido eliminado");
                            })
                          }
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <OrderDialog
          customers={customers}
          products={products}
          initial={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}

function OrderDialog({
  customers,
  products,
  initial,
  open: controlledOpen,
  onOpenChange,
}: {
  customers: CrochetCustomer[];
  products: CrochetProduct[];
  initial?: CrochetOrder | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar pedido" : "Nuevo pedido"}</DialogTitle>
        </DialogHeader>
        <form
          key={initial?.id ?? "new"}
          className="space-y-3"
          action={(fd) => {
            startTransition(async () => {
              const productId = String(fd.get("product_id") || "");
              const res = await upsertOrder({
                id: initial?.id,
                customer_id: String(fd.get("customer_id") || "") || null,
                product_id: productId || null,
                description: String(fd.get("description")),
                requested_date: String(fd.get("requested_date") || "") || null,
                delivery_date: String(fd.get("delivery_date") || "") || null,
                agreed_price: Number(fd.get("agreed_price") || 0),
                // Solo se actualiza con Registrar pago (no inventar cobros aquí)
                advance_received: initial?.advance_received ?? 0,
                status: String(fd.get("status")) as OrderStatus,
                payment_method:
                  (String(fd.get("payment_method") || "") as PaymentMethod) ||
                  null,
                materials_cost: 0,
                packaging_cost: 0,
                shipping_cost: 0,
                other_costs: 0,
                notes: String(fd.get("notes") || "") || null,
              });
              if (res.error) toast.error(res.error);
              else {
                toast.success(isEdit ? "Pedido actualizado" : "Pedido creado");
                setOpen(false);
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="description">Qué es</Label>
            <Input
              id="description"
              name="description"
              required
              defaultValue={initial?.description ?? ""}
              placeholder="Ej. Amigurumi gato"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Cliente</span>
              <select
                name="customer_id"
                className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                defaultValue={initial?.customer_id ?? ""}
              >
                <option value="">Sin cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Hecho listo (opcional)</span>
              <select
                name="product_id"
                className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                defaultValue={initial?.product_id ?? ""}
              >
                <option value="">Encargo / otro</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stock})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agreed_price">Precio</Label>
            <Input
              id="agreed_price"
              name="agreed_price"
              type="number"
              required
              defaultValue={initial?.agreed_price ?? ""}
            />
            {isEdit && (initial?.advance_received ?? 0) > 0 && (
              <p className="text-xs text-ink-muted">
                Ya cobrado: ₡
                {initial!.advance_received.toLocaleString("es-CR")} (vía
                Registrar pago)
              </p>
            )}
            {!isEdit && (
              <p className="text-xs text-ink-muted">
                Si ya te pagaron algo, después usa Registrar pago para que sume
                en tu cuenta.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="delivery_date">Entrega</Label>
              <Input
                id="delivery_date"
                name="delivery_date"
                type="date"
                defaultValue={initial?.delivery_date ?? ""}
              />
            </div>
            <label className="space-y-1 text-sm">
              <span>Estado</span>
              <select
                name="status"
                defaultValue={initial?.status ?? "consulta"}
                className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <input
            type="hidden"
            name="requested_date"
            value={initial?.requested_date ?? ""}
          />
          <input
            type="hidden"
            name="payment_method"
            value={initial?.payment_method ?? ""}
          />
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={initial?.notes ?? ""}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear pedido"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  order,
  accounts,
}: {
  order: CrochetOrder;
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const cash = accounts.filter((a) => a.type !== "credit_card");
  const owed = orderBalance(order);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          {owed > 0 ? "Registrar pago" : "Sumar pago a cuenta"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pago del pedido</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink-muted">
          Esto sí suma plata a la cuenta que elijas (ingreso crochet).
        </p>
        <form
          className="space-y-3"
          action={(fd) => {
            startTransition(async () => {
              const res = await registerOrderPayment({
                order_id: order.id,
                amount: Number(fd.get("amount")),
                date: String(fd.get("date")),
                method: (String(fd.get("method") || "") as PaymentMethod) || null,
                account_id: String(fd.get("account_id")),
                note: String(fd.get("note") || "") || null,
              });
              if (res.error) toast.error(res.error);
              else {
                toast.success("Pago sumado a tu cuenta");
                setOpen(false);
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto que te pagaron</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              defaultValue={owed > 0 ? owed : order.agreed_price}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={toISODate(new Date())}
              required
            />
          </div>
          <label className="block space-y-1 text-sm">
            <span>¿A qué cuenta entró?</span>
            <select
              name="account_id"
              required
              className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              defaultValue={
                cash.find((a) => a.type === "bank")?.id ?? cash[0]?.id
              }
            >
              {cash.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>¿Cómo te pagaron?</span>
            <select
              name="method"
              className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              defaultValue="sinpe"
            >
              <option value="sinpe">SINPE</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <Button type="submit" className="w-full" disabled={pending}>
            Guardar pago
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
