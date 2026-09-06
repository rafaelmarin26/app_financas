export type TransactionType = "receita" | "despesa";

export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  created_at: string;
  /** Preenchidos juntos quando o lançamento faz parte de uma recorrência. */
  series_id: string | null;
  recurrence: string | null;
  series_index: number | null;
  series_total: number | null;
};

/** A que lançamentos uma edição ou exclusão se aplica. */
export type SeriesScope = "one" | "future";

export type TransactionInput = {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
};

export type TransactionFilters = {
  year: number | null;
  month: number | null;
  category: string | null;
  type: TransactionType | null;
  search: string;
};
