import { CATEGORY_VALUES } from "./categories";
import type { TransactionInput } from "./types";

export type FieldErrors = Partial<Record<keyof TransactionInput, string>>;

export type ValidationResult =
  | { ok: true; data: TransactionInput }
  | { ok: false; errors: FieldErrors };

/** Aceita "1.234,56", "1234.56" e "1234,56". */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return null;

  const normalized =
    cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function validateTransaction(form: FormData): ValidationResult {
  const errors: FieldErrors = {};

  const description = String(form.get("description") ?? "").trim();
  const rawAmount = String(form.get("amount") ?? "");
  const date = String(form.get("date") ?? "").trim();
  const type = String(form.get("type") ?? "");
  const category = String(form.get("category") ?? "");

  if (description.length < 2) {
    errors.description = "Descreva a transação com pelo menos 2 caracteres.";
  } else if (description.length > 120) {
    errors.description = "Use no máximo 120 caracteres.";
  }

  const amount = parseAmount(rawAmount);
  if (amount === null) {
    errors.amount = "Informe um valor.";
  } else if (amount <= 0) {
    errors.amount = "O valor precisa ser maior que zero.";
  } else if (amount > 999_999_999) {
    errors.amount = "Valor acima do limite suportado.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = "Informe uma data válida.";
  }

  if (type !== "receita" && type !== "despesa") {
    errors.type = "Escolha receita ou despesa.";
  }

  if (!CATEGORY_VALUES.includes(category)) {
    errors.category = "Escolha uma categoria.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      description,
      amount: Math.round((amount as number) * 100) / 100,
      date,
      type: type as "receita" | "despesa",
      category,
    },
  };
}
