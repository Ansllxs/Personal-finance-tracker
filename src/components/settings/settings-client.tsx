"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import {
  BarChart3,
  Download,
  Pencil,
  PieChart,
  Sparkles,
  Sprout,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCategory,
  exportAllCsv,
  importTransactionsCsv,
  resetAndSeed,
  updateProfile,
  upsertCategory,
} from "@/lib/actions/settings";
import type { Category, CategoryScope, CategoryType, Profile } from "@/lib/types";

export function SettingsClient({
  profile,
  categories,
}: {
  profile: Profile | null;
  categories: Category[];
}) {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const [importText, setImportText] = useState("");

  return (
    <div className="space-y-5 pb-10">
      <Card className="bg-cream/60">
        <CardHeader>
          <CardTitle className="text-lg">Cómo usar la app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-ink-muted">
          <p>
            1. Toca <strong className="text-ink">Sumar</strong> →{" "}
            <strong className="text-ink">Gasto</strong> o{" "}
            <strong className="text-ink">Ingreso</strong>.
          </p>
          <p>
            2. El disponible se calcula solo con lo que registres. En Cuentas
            puedes ajustar el saldo inicial si quieres.
          </p>
          <p>
            3. En crochet, para que la venta sume plata usa{" "}
            <strong className="text-ink">Registrar pago</strong> (no solo
            “ya cobrado”).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extras (opcionales)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/presupuesto">
              <PieChart className="h-3.5 w-3.5" /> Presupuesto
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/metas">
              <Sparkles className="h-3.5 w-3.5" /> Metas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/reportes">
              <BarChart3 className="h-3.5 w-3.5" /> Reportes
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            action={(fd) => {
              startTransition(async () => {
                const res = await updateProfile({
                  display_name: String(fd.get("display_name")),
                  theme: (theme as "light" | "dark" | "system") || "light",
                  monthly_income_expected: Number(
                    fd.get("monthly_income_expected") || 0
                  ),
                });
                if (res.error) toast.error(res.error);
                else toast.success("Perfil actualizado");
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Nombre</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile?.display_name ?? "Angie"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                value={profile?.email ?? ""}
                disabled
                readOnly
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly_income_expected">
                Ingreso mensual esperado (₡)
              </Label>
              <Input
                id="monthly_income_expected"
                name="monthly_income_expected"
                type="number"
                defaultValue={profile?.monthly_income_expected ?? 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Input value="CRC — colón costarricense (₡)" disabled readOnly />
            </div>
            <Button type="submit" disabled={pending}>
              Guardar perfil
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Modo oscuro</p>
            <p className="text-xs text-ink-muted">
              El tema claro es el predeterminado. El oscuro es opcional.
            </p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Activar modo oscuro"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de ejemplo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-muted">
            La app ya carga datos de ejemplo al abrir. Si quieres reiniciar
            (Beca U, cuentas, metas, crochet), usa este botón. Los saldos y la
            deuda quedan vacíos para que los completes.
          </p>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await resetAndSeed();
                if (!res.ok) toast.error("No se pudo reiniciar");
                else toast.success("Datos de ejemplo listos");
              })
            }
          >
            <Sprout className="h-4 w-4" />
            Reiniciar datos de ejemplo
          </Button>
        </CardContent>
      </Card>

      <CategoriesSection categories={categories} />

      <Card>
        <CardHeader>
          <CardTitle>Exportar / importar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await exportAllCsv();
                if ("error" in res) {
                  toast.error(res.error);
                  return;
                }
                const blob = new Blob([res.csv], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = res.filename;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("CSV descargado");
              })
            }
          >
            <Download className="h-4 w-4" />
            Exportar todo a CSV
          </Button>

          <div className="space-y-2">
            <Label htmlFor="import">
              Importar movimientos (CSV: date,type,amount,description,tag)
            </Label>
            <Textarea
              id="import"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
              placeholder={`date,type,amount,description,tag\n2026-08-01,expense,5000,Café,personal`}
            />
            <Button
              variant="outline"
              disabled={pending || !importText.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await importTransactionsCsv(importText);
                  if (res.error) toast.error(res.error);
                  else toast.success(`Importados ${res.count} movimientos`);
                })
              }
            >
              Importar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Mis datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-ink-muted">
          <p>
            Esta app <strong className="text-ink">nunca</strong> se conecta
            automáticamente a tu banco ni a SINPE. Tú registras cada movimiento
            a mano. En local, tus datos se guardan en la carpeta{" "}
            <code className="text-ink">.data/</code> de este proyecto.
          </p>
          <p>
            Para instalarla como app en iPhone: Safari → Compartir → “Añadir a
            pantalla de inicio”. En Mac: el menú de instalación del navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Category | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorías</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-muted">
          Puedes editar o eliminar cualquier categoría, incluidas las de ejemplo.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2 text-sm"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: c.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-xs text-ink-muted">
                  {c.type} · {c.scope}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Editar ${c.name}`}
                onClick={() => setEditing(c)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Eliminar ${c.name}`}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4 text-rose-deep" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar “{c.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Los movimientos que la usaban quedarán sin categoría. También
                      se quita del presupuesto.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        startTransition(async () => {
                          const res = await deleteCategory(c.id);
                          if (res.error) toast.error(res.error);
                          else toast.success("Categoría eliminada");
                        })
                      }
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>

        <form
          className="grid gap-3 sm:grid-cols-4"
          action={(fd) => {
            startTransition(async () => {
              const res = await upsertCategory({
                name: String(fd.get("name")),
                type: String(fd.get("type")) as CategoryType,
                scope: String(fd.get("scope")) as CategoryScope,
                color: String(fd.get("color") || "#D4A5A5"),
              });
              if (res.error) toast.error(res.error);
              else toast.success("Categoría creada");
            });
          }}
        >
          <Input name="name" placeholder="Nueva categoría" required />
          <select
            name="type"
            defaultValue="expense"
            className="h-11 rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
            <option value="crochet">Crochet</option>
          </select>
          <select
            name="scope"
            defaultValue="personal"
            className="h-11 rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
          >
            <option value="personal">Personal</option>
            <option value="crochet">Crochet</option>
            <option value="both">Ambos</option>
          </select>
          <Button type="submit" disabled={pending}>
            Agregar
          </Button>
        </form>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar categoría</DialogTitle>
            </DialogHeader>
            {editing && (
              <form
                className="space-y-3"
                action={(fd) => {
                  startTransition(async () => {
                    const res = await upsertCategory({
                      id: editing.id,
                      name: String(fd.get("name")),
                      type: String(fd.get("type")) as CategoryType,
                      scope: String(fd.get("scope")) as CategoryScope,
                      color: String(fd.get("color") || editing.color),
                    });
                    if (res.error) toast.error(res.error);
                    else {
                      toast.success("Categoría actualizada");
                      setEditing(null);
                    }
                  });
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editing.name}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span>Tipo</span>
                    <select
                      name="type"
                      defaultValue={editing.type}
                      className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                    >
                      <option value="expense">Gasto</option>
                      <option value="income">Ingreso</option>
                      <option value="crochet">Crochet</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>Ámbito</span>
                    <select
                      name="scope"
                      defaultValue={editing.scope}
                      className="flex h-11 w-full rounded-xl border border-rose-dust/25 bg-paper px-3 text-sm"
                    >
                      <option value="personal">Personal</option>
                      <option value="crochet">Crochet</option>
                      <option value="both">Ambos</option>
                    </select>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-color">Color</Label>
                  <Input
                    id="edit-color"
                    name="color"
                    type="color"
                    defaultValue={editing.color}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Guardar cambios
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
