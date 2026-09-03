import { formatCurrency } from "@/lib/utils";

const SLICES = [
  { label: "Moradia", value: 1850, color: "var(--chart-rank-1)" },
  { label: "Alimentação", value: 1120, color: "var(--chart-rank-2)" },
  { label: "Transporte", value: 640, color: "var(--chart-rank-3)" },
  { label: "Lazer", value: 410, color: "var(--chart-rank-4)" },
  { label: "Saúde", value: 280, color: "var(--chart-rank-5)" },
];

const TOTAL = SLICES.reduce((sum, s) => sum + s.value, 0);

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Arcos do anel, calculados uma vez no módulo — os dados são estáticos.
const GAP = 2; // respiro entre as fatias, igual ao paddingAngle do donut real

const ARCS = SLICES.map((slice, index) => {
  const before = SLICES.slice(0, index).reduce((sum, s) => sum + s.value, 0);
  const length = (slice.value / TOTAL) * CIRCUMFERENCE - GAP;
  return { ...slice, length, offset: -(before / TOTAL) * CIRCUMFERENCE };
});

/** Mock estático do dashboard, só para a landing — não usa dados reais. */
export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="rounded-2xl border border-border bg-card p-4 shadow-xl shadow-black/5 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Setembro de 2026</p>
          <p className="text-sm font-medium">Resumo do mês</p>
        </div>
        <span className="rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
          +12% vs. agosto
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Receitas", value: 8200, tone: "text-success" },
          { label: "Despesas", value: 4300, tone: "text-destructive" },
          { label: "Saldo", value: 3900, tone: "text-foreground" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-[11px] text-muted-foreground">{card.label}</p>
            <p className={`mt-1 text-sm font-semibold tabular-nums sm:text-base ${card.tone}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-5 rounded-lg border border-border bg-background/60 p-4">
        <svg viewBox="0 0 140 140" className="size-28 shrink-0 -rotate-90">
          {ARCS.map((arc) => (
            <circle
              key={arc.label}
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth="20"
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={arc.offset}
            />
          ))}
        </svg>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {SLICES.map((slice) => (
            <li key={slice.label} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-muted-foreground">{slice.label}</span>
              <span className="ml-auto shrink-0 font-medium tabular-nums">
                {Math.round((slice.value / TOTAL) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
