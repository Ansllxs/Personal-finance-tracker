"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCRC } from "@/lib/format";

export function ExpenseChart({
  data,
}: {
  data: { name: string; amount: number; color: string }[];
}) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        Aún no hay gastos personales este mes para graficar.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCRC(Number(value ?? 0))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(212,165,165,0.25)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
        {data.slice(0, 6).map((d) => (
          <li key={d.name} className="flex items-center gap-1.5 text-ink-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: d.color }}
              aria-hidden
            />
            <span className="truncate">{d.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
