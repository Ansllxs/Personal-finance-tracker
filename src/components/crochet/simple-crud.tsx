"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  markProductSold,
  upsertCustomer,
  upsertMaterial,
  upsertProduct,
} from "@/lib/actions/crochet";
import type {
  CrochetCustomer,
  CrochetMaterial,
  CrochetProduct,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
export function ProductsClient({ products }: { products: CrochetProduct[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
            <form
              className="space-y-3"
              action={(fd) => {
                startTransition(async () => {
                  const res = await upsertProduct({
                    name: String(fd.get("name")),
                    suggested_price:
                      Number(fd.get("suggested_price") || 0) || null,
                    estimated_hours: null,
                    materials_cost_estimate: 0,
                    stock: Number(fd.get("stock") || 1),
                    sold_count: 0,
                    is_custom_base: false,
                    notes: String(fd.get("notes") || "") || null,
                  });
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Guardado en hechos");
                    setOpen(false);
                  }
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Qué hiciste</Label>
                <Input
                  id="name"
                  name="name"
                  required
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
                    min={1}
                    defaultValue={1}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="suggested_price">
                    Precio (opcional)
                  </Label>
                  <Input
                    id="suggested_price"
                    name="suggested_price"
                    type="number"
                    placeholder="₡"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Nota (opcional)</Label>
                <Input id="notes" name="notes" placeholder="Color, tamaño…" />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          title="Todavía no hay nada hecho"
          description="Cuando termines un tejido, agrégalo aquí."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((p) => {
            const sold = p.sold_count ?? 0;
            const ready = p.stock ?? 0;
            const soldOut = ready <= 0 && sold > 0;
            return (
              <Card
                key={p.id}
                className={cn(soldOut && "opacity-70")}
              >
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
                        {sold > 0 ? ` · ${sold} vendido${sold === 1 ? "" : "s"}` : ""}
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
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-cream/80 px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-rose-dust/40"
                      checked={soldOut}
                      disabled={pending || (ready <= 0 && sold <= 0)}
                      onChange={(e) => {
                        const wantSold = e.target.checked;
                        startTransition(async () => {
                          if (wantSold) {
                            let lastError: string | undefined;
                            for (let i = 0; i < ready; i++) {
                              const res = await markProductSold(p.id, true);
                              if (res.error) {
                                lastError = res.error;
                                break;
                              }
                            }
                            if (lastError) toast.error(lastError);
                            else toast.success("Marcado como vendido");
                          } else {
                            let lastError: string | undefined;
                            for (let i = 0; i < sold; i++) {
                              const res = await markProductSold(p.id, false);
                              if (res.error) {
                                lastError = res.error;
                                break;
                              }
                            }
                            if (lastError) toast.error(lastError);
                            else toast.success("De vuelta a listos");
                          }
                        });
                      }}
                    />
                    <span className="font-medium">Ya vendí este producto</span>
                  </label>
                  {ready > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await markProductSold(p.id, true);
                          if (res.error) toast.error(res.error);
                          else toast.success("Vendí 1");
                        })
                      }
                    >
                      Vendí solo 1
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
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
