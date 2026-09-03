import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Summary } from "@/lib/summary";

function StatTile({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone: "income" | "expense" | "neutral";
}) {
  const valueTone =
    tone === "income"
      ? "text-success"
      : tone === "expense"
        ? "text-destructive"
        : value < 0
          ? "text-destructive"
          : "text-foreground";

  const iconTone =
    tone === "income"
      ? "bg-success/12 text-success"
      : tone === "expense"
        ? "bg-destructive/12 text-destructive"
        : "bg-primary/10 text-primary";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", iconTone)}>
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]",
          valueTone,
        )}
      >
        {formatCurrency(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const savingsRate =
    summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : null;

  const balanceHint =
    summary.count === 0
      ? "Sem lançamentos no período"
      : savingsRate === null
        ? "Nenhuma receita registrada no período"
        : savingsRate >= 0
          ? `Você guardou ${savingsRate}% do que recebeu`
          : `Você gastou ${Math.abs(savingsRate)}% a mais do que recebeu`;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile
        label="Receitas"
        value={summary.income}
        hint="Tudo o que entrou no período"
        icon={<ArrowUpRight className="size-4" />}
        tone="income"
      />
      <StatTile
        label="Despesas"
        value={summary.expense}
        hint="Tudo o que saiu no período"
        icon={<ArrowDownLeft className="size-4" />}
        tone="expense"
      />
      <StatTile
        label="Saldo"
        value={summary.balance}
        hint={balanceHint}
        icon={<Wallet className="size-4" />}
        tone="neutral"
      />
    </div>
  );
}
