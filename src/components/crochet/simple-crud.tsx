"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/shared/money-amount";
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
import {
  deleteCustomer,
  deleteMaterial,
  deleteProduct,
  sellProduct,
  upsertCustomer,
  upsertMaterial,
  upsertProduct,
} from "@/lib/actions/crochet";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn, toISODate } from "@/lib/utils";
import type {
  Account,
  CrochetCustomer,
  CrochetMaterial,
  CrochetProduct,
  PaymentMethod,
} from "@/lib/types";

export function CustomersClient({
  customers,
  orderTotals,
}: {
  customers: CrochetCustomer[];
  orderTotals: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cliente</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              action={(fd) => {
                startTransition(async () => {
                  const res = await upsertCustomer({
                    name: String(fd.get("name")),
                    contact: String(fd.get("contact") || "") || null,
                    notes: String(fd.get("notes") || "") || null,
                  });
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Cliente guardado");
                    setOpen(false);
                  }
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact">Contacto</Label>
                <Input id="contact" name="contact" placeholder="WhatsApp / IG" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {customers.length === 0 ? (
        <EmptyState title="Sin clientes" description="Agrega a quien te pide encargos." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {customers.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-ink-muted">{c.contact || "Sin contacto"}</p>
                  <p className="mt-1 text-sm">
                    Total comprado:{" "}
                    <MoneyAmount amount={orderTotals[c.id] ?? 0} size="sm" />
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Eliminar cliente"
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deleteCustomer(c.id);
                      if (res.error) toast.error(res.error);
                      else toast.success("Eliminado");
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-rose-deep" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inventario simple: cosas que ya tejiste */
export function ProductsClient({
  products,
  accounts,
}: {
  products: CrochetProduct[];
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CrochetProduct | null>(null);
  const [pending, startTransition] = useTransition();
  const cashAccounts = accounts.filter((a) => a.is_active && a.type !== "credit_card");

  const sorted = [...products].sort((a, b) => {
    const aSoldOut = (a.stock ?? 0) <= 0 && (a.sold_count ?? 0) > 0;
    const bSoldOut = (b.stock ?? 0) <= 0 && (b.sold_count ?? 0) > 0;
    if (aSoldOut !== bSoldOut) return aSoldOut ? 1 : -1;
    return a.name.localeCompare(b.name, "es");
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Acabo de hacer uno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Producto hecho</DialogTitle>
            </DialogHeader>
            <ProductForm
              pending={pending}
              onSubmit={(data) => {
                startTransition(async () => {
                  const res = await upsertProduct({ ...data, sold_count: 0 });
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Guardado en hechos");
                    setOpen(false);
                  }
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          title="Todavía no hay nada hecho"
          description="Cuando termines un tejido, agrégalo aquí. Al venderlo, registra la plata."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((p) => {
            const sold = p.sold_count ?? 0;
            const ready = p.stock ?? 0;
            const soldOut = ready <= 0 && sold > 0;
            return (
              <Card key={p.id} className={cn(soldOut && "opacity-70")}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "font-medium",
                            soldOut && "line-through text-ink-muted"
                          )}
                        >
                          {p.name}
                        </p>
                        {soldOut && <Badge variant="outline">Vendido</Badge>}
                        {!soldOut && sold > 0 && (
                          <Badge variant="secondary">
                            {sold} vendido{sold === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-ink-muted">
                        {ready} listo{ready === 1 ? "" : "s"}
                        {sold > 0
                          ? ` · ${sold} vendido${sold === 1 ? "" : "s"}`
                          : ""}
                        {p.suggested_price != null
                          ? ` · ${p.suggested_price.toLocaleString("es-CR")} ₡`
                          : ""}
                      </p>
                      {p.notes && (
                        <p className="mt-1 text-xs text-ink-muted">{p.notes}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Editar"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await upsertProduct({
                              id: p.id,
                              name: p.name,
                              suggested_price: p.suggested_price,
                              estimated_hours: p.estimated_hours,
                              materials_cost_estimate: 0,
                              stock: ready + 1,
                              sold_count: sold,
                              is_custom_base: false,
                              notes: p.notes,
                            });
                            if (res.error) toast.error(res.error);
                            else toast.success("+1 hecho");
                          })
                        }
                      >
                        +1
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Eliminar"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteProduct(p.id);
                            if (res.error) toast.error(res.error);
                            else toast.success("Eliminado");
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-rose-deep" />
                      </Button>
                    </div>
                  </div>
                  {ready > 0 && (
                    <SellProductDialog
                      product={p}
                      accounts={cashAccounts}
                      pending={pending}
                      startTransition={startTransition}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar hecho</DialogTitle>
            </DialogHeader>
            <ProductForm
              initial={editing}
              pending={pending}
              onSubmit={(data) => {
                startTransition(async () => {
                  const res = await upsertProduct({
                    id: editing.id,
                    ...data,
                    sold_count: editing.sold_count ?? 0,
                  });
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Hecho actualizado");
                    setEditing(null);
                  }
                });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ProductForm({
  initial,
  pending,
  onSubmit,
}: {
  initial?: CrochetProduct;
  pending: boolean;
  onSubmit: (data: {
    name: string;
    suggested_price: number | null;
    estimated_hours: null;
    materials_cost_estimate: number;
    stock: number;
    is_custom_base: boolean;
    notes: string | null;
  }) => void;
}) {
  return (
    <form
      className="space-y-3"
      action={(fd) => {
        onSubmit({
          name: String(fd.get("name")),
          suggested_price: Number(fd.get("suggested_price") || 0) || null,
          estimated_hours: null,
          materials_cost_estimate: 0,
          stock: Number(fd.get("stock") || 1),
          is_custom_base: false,
          notes: String(fd.get("notes") || "") || null,
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Qué hiciste</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="Ej. Llavero Zoro, flor tejida…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="stock">Cuántos tienes listos</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={initial?.stock ?? 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="suggested_price">Precio (opcional)</Label>
          <Input
            id="suggested_price"
            name="suggested_price"
            type="number"
            placeholder="₡"
            defaultValue={initial?.suggested_price ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Nota (opcional)</Label>
        <Input
          id="notes"
          name="notes"
          placeholder="Color, tamaño…"
          defaultValue={initial?.notes ?? ""}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        Guardar
      </Button>
    </form>
  );
}

function SellProductDialog({
  product,
  accounts,
  pending,
  startTransition,
}: {
  product: CrochetProduct;
  accounts: Account[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const ready = product.stock ?? 0;
  const defaultAmount =
    product.suggested_price != null ? product.suggested_price : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full" variant="secondary">
          Registrar venta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender {product.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink-muted">
          Baja del inventario y suma la plata a tu cuenta.
        </p>
        <form
          className="space-y-3"
          action={(fd) => {
            startTransition(async () => {
              const res = await sellProduct({
                product_id: product.id,
                quantity: Number(fd.get("quantity") || 1),
                amount: Number(fd.get("amount") || 0),
                account_id: String(fd.get("account_id")),
                method:
                  (String(fd.get("method") || "") as PaymentMethod) || null,
                date: String(fd.get("date") || toISODate(new Date())),
                note: String(fd.get("note") || "") || null,
              });
              if (res.error) toast.error(res.error);
              else {
                toast.success("Venta registrada en tu cuenta");
                setOpen(false);
              }
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`qty-${product.id}`}>Cuántos</Label>
              <Input
                id={`qty-${product.id}`}
                name="quantity"
                type="number"
                min={1}
                max={ready}
                defaultValue={1}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`amt-${product.id}`}>Te pagaron (₡)</Label>
              <Input
                id={`amt-${product.id}`}
                name="amount"
                type="number"
                min={1}
                defaultValue={defaultAmount}
                required
              />
            </div>
          </div>
          <label className="block space-y-1 text-sm">
            <span>¿A qué cuenta entró?</span>
            <select
              name="account_id"
              required
              className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
              defaultValue={
                accounts.find((a) => a.type === "bank")?.id ?? accounts[0]?.id
              }
            >
              {accounts.map((a) => (
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
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                )
              )}
            </select>
          </label>
          <div className="space-y-1.5">
            <Label htmlFor={`date-${product.id}`}>Fecha</Label>
            <Input
              id={`date-${product.id}`}
              name="date"
              type="date"
              defaultValue={toISODate(new Date())}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`note-${product.id}`}>Nota (opcional)</Label>
            <Input id={`note-${product.id}`} name="note" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Guardar venta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialsClient({
  materials,
}: {
  materials: CrochetMaterial[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nuevo material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Material</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              action={(fd) => {
                startTransition(async () => {
                  const res = await upsertMaterial({
                    name: String(fd.get("name")),
                    type: String(fd.get("type") || "hilo"),
                    color: String(fd.get("color") || "") || null,
                    purchase_cost: Number(fd.get("purchase_cost") || 0),
                    quantity: Number(fd.get("quantity") || 0),
                    unit: String(fd.get("unit") || "unidad"),
                    supplier: String(fd.get("supplier") || "") || null,
                    min_level: Number(fd.get("min_level") || 0),
                  });
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Material guardado");
                    setOpen(false);
                  }
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Tipo</Label>
                  <Input id="type" name="type" defaultValue="hilo" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" name="color" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="purchase_cost">Costo compra</Label>
                  <Input id="purchase_cost" name="purchase_cost" type="number" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input id="unit" name="unit" defaultValue="ovillo" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="min_level">Nivel mínimo</Label>
                  <Input id="min_level" name="min_level" type="number" defaultValue={1} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier">Proveedor (opcional)</Label>
                <Input id="supplier" name="supplier" />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {materials.length === 0 ? (
        <EmptyState title="Inventario vacío" description="Registra hilos, relleno, ojos, empaques…" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((m) => {
            const low = m.quantity <= m.min_level;
            return (
              <Card key={m.id} className={low ? "border-rose-dust bg-rose-mist/20" : ""}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-ink-muted">
                      {m.type}
                      {m.color ? ` · ${m.color}` : ""} · {m.quantity} {m.unit}
                    </p>
                    <p className="text-sm">
                      Costo: <MoneyAmount amount={m.purchase_cost} size="sm" />
                    </p>
                    {low && <Badge variant="over" className="mt-1">Stock bajo</Badge>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar material"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await deleteMaterial(m.id);
                        if (res.error) toast.error(res.error);
                        else toast.success("Eliminado");
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-rose-deep" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
