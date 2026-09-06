import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { monthRange } from "@/lib/utils";
import type { Transaction, TransactionFilters } from "@/lib/types";

const BASE_COLUMNS =
  "id, user_id, description, amount, date, type, category, created_at";

const SERIES_COLUMNS = ", series_id, recurrence, series_index, series_total";

/** Código do Postgres para "coluna não existe". */
const UNDEFINED_COLUMN = "42703";

/**
 * As colunas de recorrência só existem depois da migração 0001. Enquanto ela
 * não roda — e isso acontece de verdade entre publicar o código e rodar o SQL —
 * o app precisa continuar de pé, só sem a recorrência. Na primeira consulta que
 * falhar com 42703 as leituras passam a usar as colunas antigas e as páginas
 * mostram um aviso pedindo a migração.
 *
 * O estado não é definitivo: a cada minuto o app tenta de novo com as colunas
 * completas, então rodar o SQL faz o aviso sumir sozinho, sem reiniciar o
 * servidor. O custo, no pior caso, é uma consulta perdida por minuto.
 */
const RECHECK_INTERVAL_MS = 60_000;

let seriesUnavailableSince: number | null = null;

function shouldTrySeriesColumns() {
  if (seriesUnavailableSince === null) return true;
  return Date.now() - seriesUnavailableSince > RECHECK_INTERVAL_MS;
}

export function isRecurrenceSchemaMissing() {
  return seriesUnavailableSince !== null;
}

type QueryResult = {
  data: Record<string, unknown>[] | null;
  error: { message: string; code?: string } | null;
};

/**
 * Executa a consulta e, se o banco reclamar das colunas de série, repete uma
 * única vez sem elas.
 */
async function selectWithFallback(
  build: (cols: string) => PromiseLike<QueryResult>,
): Promise<Record<string, unknown>[]> {
  const withSeries = shouldTrySeriesColumns();
  const first = await build(withSeries ? BASE_COLUMNS + SERIES_COLUMNS : BASE_COLUMNS);

  if (withSeries && first.error?.code === UNDEFINED_COLUMN) {
    seriesUnavailableSince = Date.now();
    const retry = await build(BASE_COLUMNS);
    if (retry.error) throw new Error(retry.error.message);
    return retry.data ?? [];
  }

  if (first.error) throw new Error(first.error.message);

  // A consulta completa passou: a migração está aplicada.
  if (withSeries) seriesUnavailableSince = null;

  return first.data ?? [];
}

function normalize(row: Record<string, unknown>): Transaction {
  return {
    ...(row as unknown as Transaction),
    amount: Number(row.amount),
    // Sem a migração, a série simplesmente não existe para este lançamento.
    series_id: (row.series_id as string | null) ?? null,
    recurrence: (row.recurrence as string | null) ?? null,
    series_index: (row.series_index as number | null) ?? null,
    series_total: (row.series_total as number | null) ?? null,
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

  const rows = await selectWithFallback((cols) => {
    const base = supabase
      .from("transactions")
      .select(cols)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000);

    return applyFilters(base, filters) as unknown as PromiseLike<QueryResult>;
  });

  return rows.map(normalize);
}

/** Transações dos últimos `months` meses, para o gráfico de evolução. */
export async function listRecentMonths(months: number): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];

  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (months - 1), 1));
  const startISO = start.toISOString().slice(0, 10);

  const supabase = await createClient();

  const rows = await selectWithFallback(
    (cols) =>
      supabase
        .from("transactions")
        .select(cols)
        .gte("date", startISO)
        .order("date", { ascending: true })
        .limit(2000) as unknown as PromiseLike<QueryResult>,
  );

  return rows.map(normalize);
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
