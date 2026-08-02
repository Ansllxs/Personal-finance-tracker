/** Formato CRC: ₡295.000 (sin decimales innecesarios) */
export function formatCRC(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "₡—";
  }
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString("es-CR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
  const sign = amount < 0 ? "−" : "";
  return `${sign}₡${formatted}`;
}

export function formatCRCSigned(amount: number): string {
  if (amount > 0) return `+${formatCRC(amount)}`;
  if (amount < 0) return formatCRC(amount);
  return formatCRC(0);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDateES(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthNameES(month: number): string {
  const names = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Setiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return names[month - 1] ?? "";
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}
