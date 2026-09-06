import { categoryLabel } from "./categories";
import { frequencyLabel } from "./recurrence";
import { formatDate } from "./utils";
import type { Transaction } from "./types";

const HEADERS = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)", "Recorrência"];

/**
 * Escapa um campo para CSV. O separador é `;` e os decimais usam vírgula,
 * que é o formato que o Excel em português abre sem pedir importação.
 */
function escape(value: string) {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function transactionsToCSV(transactions: Transaction[]) {
  const rows = transactions.map((t) =>
    [
      formatDate(t.date),
      escape(t.description),
      categoryLabel(t.category),
      t.type === "receita" ? "Receita" : "Despesa",
      (t.type === "receita" ? t.amount : -t.amount).toFixed(2).replace(".", ","),
      t.series_id
        ? `${frequencyLabel(t.recurrence ?? "")} ${t.series_index}/${t.series_total}`
        : "",
    ].join(";"),
  );

  // BOM para o Excel reconhecer o UTF-8 e não corromper os acentos.
  return `\uFEFF${[HEADERS.join(";"), ...rows].join("\r\n")}\r\n`;
}

export function csvFilename(prefix = "transacoes") {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  return `${prefix}-${stamp}.csv`;
}
