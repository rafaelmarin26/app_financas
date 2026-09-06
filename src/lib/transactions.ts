import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { monthRange } from "@/lib/utils";
import type { Transaction, TransactionFilters } from "@/lib/types";

const COLUMNS =
  "id, user_id, description, amount, date, type, category, created_at, series_id, recurrence, series_index, series_total";

function normalize(row: Record<string, unknown>): Transaction {
  return {
    ...(row as unknown as Transaction),
    amount: Number(row.amount),
  };
}

/** Aplica os filtros de período/categoria/tipo/busca sobre a query do PostgREST. */
function applyFilters<T extends { gte: unknown }>(query: T, filters: TransactionFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = query as any;

  if (filters.year !== null) {
    if (filters.month !== null) {
      const { start, end } = monthRange(filters.year, filters.month);
      q = q.gte("date", start).lte("date", end);
    } else {
      q = q.gte("date", `${filters.year}-01-01`).lte("date", `${filters.year}-12-31`);
    }
  }
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.search) {
    // Escapa vírgula e parênteses, que são separadores na sintaxe do PostgREST.
    const term = filters.search.replace(/[,()*]/g, " ").trim();
    if (term) q = q.ilike("description", `%${term}%`);
  }

  return q as T;
}

export async function listTransactions(
  filters: TransactionFilters,
): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const base = supabase
    .from("transactions")
    .select(COLUMNS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);

  const { data, error } = await applyFilters(base, filters);
  if (error) throw new Error(error.message);

  return (data ?? []).map(normalize);
}

/** Transações dos últimos `months` meses, para o gráfico de evolução. */
export async function listRecentMonths(months: number): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];

  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (months - 1), 1));
  const startISO = start.toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(COLUMNS)
    .gte("date", startISO)
    .order("date", { ascending: true })
    .limit(2000);

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

/** Anos que já têm lançamentos, para popular o seletor de período. */
export async function listAvailableYears(): Promise<number[]> {
  if (!isSupabaseConfigured) return [new Date().getFullYear()];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("date")
    .order("date", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);

  const currentYear = new Date().getFullYear();
  const firstYear = data?.[0]?.date
    ? Number(String(data[0].date).slice(0, 4))
    : currentYear;
  const from = Math.min(firstYear, currentYear);

  return Array.from({ length: currentYear - from + 1 }, (_, i) => currentYear - i);
}
