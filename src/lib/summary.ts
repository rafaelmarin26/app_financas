import { categoryLabel } from "./categories";
import { monthLabel } from "./utils";
import type { Transaction } from "./types";

export type Summary = {
  income: number;
  expense: number;
  balance: number;
  count: number;
};

export function summarize(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.type === "receita") income += t.amount;
    else expense += t.amount;
  }

  return {
    income,
    expense,
    balance: income - expense,
    count: transactions.length,
  };
}

export type CategorySlice = {
  category: string;
  label: string;
  total: number;
  share: number;
};

/** Agrupa por categoria, do maior para o menor total. */
export function byCategory(
  transactions: Transaction[],
  type: "receita" | "despesa",
): CategorySlice[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const t of transactions) {
    if (t.type !== type) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    grandTotal += t.amount;
  }

  return [...totals.entries()]
    .map(([category, total]) => ({
      category,
      label: categoryLabel(category),
      total,
      share: grandTotal > 0 ? total / grandTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export type MonthlyPoint = {
  key: string;
  label: string;
  receitas: number;
  despesas: number;
};

/** Série dos últimos `months` meses terminando no mês atual. */
export function monthlySeries(
  transactions: Transaction[],
  months: number,
): MonthlyPoint[] {
  const now = new Date();
  const points: MonthlyPoint[] = [];
  const index = new Map<string, MonthlyPoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point: MonthlyPoint = {
      key,
      label: monthLabel(d.getMonth() + 1).slice(0, 3),
      receitas: 0,
      despesas: 0,
    };
    points.push(point);
    index.set(key, point);
  }

  for (const t of transactions) {
    const point = index.get(t.date.slice(0, 7));
    if (!point) continue;
    if (t.type === "receita") point.receitas += t.amount;
    else point.despesas += t.amount;
  }

  return points;
}
