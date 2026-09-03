import { CATEGORY_VALUES } from "./categories";
import type { TransactionFilters, TransactionType } from "./types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Lê os filtros da query string. Valores inválidos viram `null` (= "todos"),
 * então uma URL adulterada nunca quebra a página.
 */
export function parseFilters(params: RawSearchParams): TransactionFilters {
  const now = new Date();

  const rawYear = Number(first(params.ano));
  const rawMonth = Number(first(params.mes));
  const rawCategory = first(params.categoria);
  const rawType = first(params.tipo);

  const hasPeriod = first(params.ano) !== "todos";

  const year =
    Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100
      ? rawYear
      : hasPeriod
        ? now.getFullYear()
        : null;

  const month =
    Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth
      : first(params.mes) === "todos"
        ? null
        : hasPeriod
          ? now.getMonth() + 1
          : null;

  return {
    year,
    month: year === null ? null : month,
    category:
      rawCategory && CATEGORY_VALUES.includes(rawCategory) ? rawCategory : null,
    type:
      rawType === "receita" || rawType === "despesa"
        ? (rawType as TransactionType)
        : null,
    search: (first(params.q) ?? "").trim().slice(0, 80),
  };
}


export function hasActiveFilters(filters: TransactionFilters) {
  return Boolean(filters.category || filters.type || filters.search || filters.month === null);
}
