"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { CategorySlice } from "@/lib/summary";

/**
 * Rampa ordinal de um único tom: a cor codifica magnitude (1º = mais escuro no
 * tema claro, mais claro no escuro), não identidade. A identidade vem da lista
 * ao lado, que rotula cada fatia diretamente. Validada em
 * `scripts/validate_palette.js --ordinal` nos dois temas.
 */
const RANK_COLORS = [
  "var(--chart-rank-1)",
  "var(--chart-rank-2)",
  "var(--chart-rank-3)",
  "var(--chart-rank-4)",
  "var(--chart-rank-5)",
];

/** Um gráfico de pizza só é legível até ~5 fatias; o resto vira "Demais". */
const MAX_SLICES = 5;

type Slice = CategorySlice & { color: string };

function foldSlices(slices: CategorySlice[]): Slice[] {
  if (slices.length <= MAX_SLICES) {
    return slices.map((slice, index) => ({ ...slice, color: RANK_COLORS[index] }));
  }

  const head = slices.slice(0, MAX_SLICES - 1);
  const tail = slices.slice(MAX_SLICES - 1);

  return [
    ...head.map((slice, index) => ({ ...slice, color: RANK_COLORS[index] })),
    {
      category: "__demais__",
      label: `Demais (${tail.length})`,
      total: tail.reduce((sum, slice) => sum + slice.total, 0),
      share: tail.reduce((sum, slice) => sum + slice.share, 0),
      color: "var(--chart-other)",
    },
  ];
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Slice }>;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="flex items-center gap-2 font-medium">
        <span
          className="size-2.5 rounded-full ring-2 ring-popover"
          style={{ backgroundColor: slice.color }}
        />
        {slice.label}
      </p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        {formatCurrency(slice.total)} · {(slice.share * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export function CategoryDonut({
  slices,
  total,
  title = "Despesas por categoria",
  description = "Onde o dinheiro foi parar no período selecionado.",
}: {
  slices: CategorySlice[];
  total: number;
  title?: string;
  description?: string;
}) {
  const data = useMemo(() => foldSlices(slices), [slices]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {data.length === 0 ? (
        <EmptyState
          icon={<PieChartIcon className="size-5" />}
          title="Nada para mostrar ainda"
          description="Assim que houver lançamentos no período, a divisão por categoria aparece aqui."
        />
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-5 pt-1 sm:flex-row sm:items-center">
          <div className="relative mx-auto size-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((slice) => (
                    <Cell key={slice.category} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} cursor={false} />
              </PieChart>
            </ResponsiveContainer>

            {/* Total no miolo: o número é a leitura principal, o anel é o contexto. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-muted-foreground">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* A lista é a legenda e, ao mesmo tempo, a tabela de valores. */}
          <ul className="min-w-0 flex-1 space-y-2.5">
            {data.map((slice) => (
              <li key={slice.category} className="flex items-center gap-2.5 text-sm">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate">{slice.label}</span>
                <span className="shrink-0 tabular-nums">{formatCurrency(slice.total)}</span>
                <span className="w-11 shrink-0 text-right tabular-nums text-muted-foreground">
                  {(slice.share * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
