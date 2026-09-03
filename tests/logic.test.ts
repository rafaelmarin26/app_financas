/* Verificações da lógica pura do app: `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { summarize, byCategory, monthlySeries } from "../src/lib/summary";
import { transactionsToCSV } from "../src/lib/csv";
import { parseFilters } from "../src/lib/filters";
import { parseAmount, validateTransaction } from "../src/lib/validation";
import { monthRange, formatDate, formatCurrency } from "../src/lib/utils";
import type { Transaction } from "../src/lib/types";

const t = (
  id: string,
  description: string,
  amount: number,
  date: string,
  type: "receita" | "despesa",
  category: string,
): Transaction => ({
  id,
  user_id: "u1",
  description,
  amount,
  date,
  type,
  category,
  created_at: `${date}T12:00:00Z`,
});

const now = new Date();
const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const data: Transaction[] = [
  t("1", "Salário", 5000, `${ym}-05`, "receita", "salario"),
  t("2", "Aluguel", 1800, `${ym}-06`, "despesa", "moradia"),
  t("3", "Mercado; feira", 900.5, `${ym}-07`, "despesa", "alimentacao"),
  t("4", 'Uber "centro"', 120.25, `${ym}-08`, "despesa", "transporte"),
  t("5", "Freela", 1200, `${ym}-09`, "receita", "freelance"),
];

test("Resumo", () => {
  const s = summarize(data);
  assert.equal(s.income, 6200);
  assert.equal(s.expense, 2820.75);
  assert.equal(s.balance, 3379.25);
  assert.equal(s.count, 5);
});

test("Agrupamento por categoria", () => {
  const cats = byCategory(data, "despesa");
  assert.equal(cats.length, 3);
  assert.equal(cats[0].category, "moradia", "deve vir ordenado do maior para o menor");
  assert.ok(Math.abs(cats.reduce((sum, c) => sum + c.share, 0) - 1) < 1e-9);
  assert.equal(byCategory(data, "receita").length, 2);
});

test("Série mensal", () => {
  const series = monthlySeries(data, 6);
  assert.equal(series.length, 6);
  assert.equal(series[5].receitas, 6200, "o mês atual é o último ponto");
  assert.equal(series[5].despesas, 2820.75);
  assert.equal(series[0].receitas, 0);
});

test("CSV", () => {
  const csv = transactionsToCSV(data);
  assert.ok(csv.startsWith("\uFEFF"), "precisa do BOM para o Excel");
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 6);
  assert.ok(lines[0].includes("Data;Descrição;Categoria;Tipo;Valor (R$)"));
  assert.ok(lines[1].includes("05/") && lines[1].includes("5000,00"));
  assert.ok(lines[3].includes('"Mercado; feira"'), "ponto-e-vírgula deve ser escapado");
  assert.ok(lines[4].includes('"Uber ""centro"""'), "aspas devem ser dobradas");
  assert.ok(lines[2].includes("-1800,00"), "despesa sai negativa");
});

test("Filtros", () => {
  const def = parseFilters({});
  assert.equal(def.year, now.getFullYear());
  assert.equal(def.month, now.getMonth() + 1);
  assert.equal(def.category, null);

  const all = parseFilters({ ano: "todos" });
  assert.equal(all.year, null);
  assert.equal(all.month, null);

  const bad = parseFilters({ ano: "1800", mes: "99", categoria: "cripto", tipo: "x" });
  assert.equal(bad.year, now.getFullYear(), "ano inválido cai no padrão");
  assert.equal(bad.category, null, "categoria inválida é ignorada");
  assert.equal(bad.type, null, "tipo inválido é ignorado");

});

test("Intervalo do mês", () => {
  assert.deepEqual(monthRange(2026, 2), { start: "2026-02-01", end: "2026-02-28" });
  assert.deepEqual(monthRange(2024, 2), { start: "2024-02-01", end: "2024-02-29" });
  assert.deepEqual(monthRange(2026, 12), { start: "2026-12-01", end: "2026-12-31" });
});

test("Datas e moeda", () => {
  assert.equal(formatDate("2026-09-02"), "02/09/2026", "sem deslocamento de fuso");
  assert.ok(formatCurrency(1234.5).replace(/\u00a0/g, " ").startsWith("R$ 1.234,50"));
});

test("Valores", () => {
  assert.equal(parseAmount("1.234,56"), 1234.56);
  assert.equal(parseAmount("1234.56"), 1234.56);
  assert.equal(parseAmount("1234,56"), 1234.56);
  assert.equal(parseAmount("R$ 89,90"), 89.9);
  assert.equal(parseAmount(""), null);
});

test("Validação", () => {
  function form(entries: Record<string, string>) {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.append(k, v);
    return f;
  }

  const okResult = validateTransaction(
    form({ description: "Café", amount: "12,90", date: "2026-09-02", type: "despesa", category: "alimentacao" }),
  );
  assert.equal(okResult.ok, true);
  if (okResult.ok) assert.equal(okResult.data.amount, 12.9);

  const badResult = validateTransaction(
    form({ description: "x", amount: "-5", date: "02/09/2026", type: "outro", category: "cripto" }),
  );
  assert.equal(badResult.ok, false);
  if (!badResult.ok) {
    assert.ok(badResult.errors.description);
    assert.ok(badResult.errors.amount);
    assert.ok(badResult.errors.date);
    assert.ok(badResult.errors.type);
    assert.ok(badResult.errors.category);
  }
});
