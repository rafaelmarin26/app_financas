import type { TransactionType } from "./types";

export type Category = {
  value: string;
  label: string;
  /** Tipos de transação em que a categoria costuma aparecer. */
  types: TransactionType[];
};

export const CATEGORIES: Category[] = [
  { value: "alimentacao", label: "Alimentação", types: ["despesa"] },
  { value: "transporte", label: "Transporte", types: ["despesa"] },
  { value: "moradia", label: "Moradia", types: ["despesa"] },
  { value: "lazer", label: "Lazer", types: ["despesa"] },
  { value: "saude", label: "Saúde", types: ["despesa"] },
  { value: "educacao", label: "Educação", types: ["despesa"] },
  { value: "salario", label: "Salário", types: ["receita"] },
  { value: "freelance", label: "Freelance", types: ["receita"] },
  { value: "outros", label: "Outros", types: ["receita", "despesa"] },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

const byValue = new Map(CATEGORIES.map((c) => [c.value, c]));

export function categoryLabel(value: string) {
  return byValue.get(value)?.label ?? value;
}

export function categoriesForType(type: TransactionType) {
  return CATEGORIES.filter((c) => c.types.includes(type));
}
