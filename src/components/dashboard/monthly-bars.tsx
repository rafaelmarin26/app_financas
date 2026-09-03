"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyPoint } from "@/lib/summary";

const SERIES = [
  { key: "receitas", label: "Receitas", color: "var(--chart-income)" },
  { key: "despesas", label: "Despesas", color: "var(--chart-expense)" },
] as const;

/**
 * Eixo em milhares para não empilhar zeros no rótulo. Mantém uma casa decimal
 * quando o tick não é um milhar redondo (2500 vira "2,5k", não "3k").
 */
const thousands = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function shortCurrency(value: number) {
  if (Math.abs(value) >= 1000) return `${thousands.format(value / 1000)}k`;
  return thousands.format(value);
}

function BarsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const values = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const balance = (values.receitas ?? 0) - (values.despesas ?? 0);

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full ring-2 ring-popover"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-muted-foreground">{series.label}</span>
            <span className="ml-auto pl-4 tabular-nums">
              {formatCurrency(values[series.key] ?? 0)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 border-t border-border pt-1.5 text-xs text-muted-foreground">
        Saldo:{" "}
        <span className={balance < 0 ? "text-destructive" : "text-success"}>
          {formatCurrency(balance)}
        </span>
      </p>
    </div>
  );
}

export function MonthlyBars({ data }: { data: MonthlyPoint[] }) {
  const hasData = data.some((point) => point.receitas > 0 || point.despesas > 0);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <CardTitle>Últimos 6 meses</CardTitle>
          <CardDescription className="mt-1">
            Quanto entrou e quanto saiu, mês a mês.
          </CardDescription>
        </div>
        <ul className="flex shrink-0 flex-wrap gap-x-4 gap-y-1">
          {SERIES.map((series) => (
            <li key={series.key} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <span className="text-muted-foreground">{series.label}</span>
            </li>
          ))}
        </ul>
      </CardHeader>

      <div className="h-64 px-2 pb-4 sm:px-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barGap={2}>
              <CartesianGrid
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                dy={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                tickFormatter={shortCurrency}
              />
              <Tooltip
                content={<BarsTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              {SERIES.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Registre alguns lançamentos para ver a evolução dos seus meses.
          </div>
        )}
      </div>
    </Card>
  );
}
