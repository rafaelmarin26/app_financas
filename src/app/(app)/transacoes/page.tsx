import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { MigrationNotice } from "@/components/layout/migration-notice";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { ExportCsvButton } from "@/components/transactions/export-csv-button";
import { hasActiveFilters, parseFilters } from "@/lib/filters";
import {
  isRecurrenceSchemaMissing,
  listAvailableYears,
  listTransactions,
} from "@/lib/transactions";
import { summarize } from "@/lib/summary";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Transações" };

export default async function TransactionsPage({ searchParams }: PageProps<"/transacoes">) {
  const filters = parseFilters(await searchParams);

  const [transactions, years] = await Promise.all([
    listTransactions(filters),
    listAvailableYears(),
  ]);

  const summary = summarize(transactions);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        description="Todos os seus lançamentos, com busca, filtros e exportação."
        actions={
          <>
            <ExportCsvButton transactions={transactions} />
            <TransactionDialog />
          </>
        }
      />

      <FilterBar filters={filters} years={years} />

      {isRecurrenceSchemaMissing() ? <MigrationNotice /> : null}

      {/* Resumo do recorte filtrado — o mesmo conjunto que sai no CSV. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
        <span className="text-muted-foreground">
          <strong className="font-semibold text-foreground tabular-nums">
            {summary.count}
          </strong>{" "}
          lançamento(s) no filtro
        </span>
        <span className="text-muted-foreground">
          Receitas{" "}
          <strong className="font-semibold tabular-nums text-success">
            {formatCurrency(summary.income)}
          </strong>
        </span>
        <span className="text-muted-foreground">
          Despesas{" "}
          <strong className="font-semibold tabular-nums text-destructive">
            {formatCurrency(summary.expense)}
          </strong>
        </span>
        <span className="text-muted-foreground">
          Saldo{" "}
          <strong
            className={`font-semibold tabular-nums ${
              summary.balance < 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {formatCurrency(summary.balance)}
          </strong>
        </span>
      </div>

      <TransactionList
        transactions={transactions}
        isFiltered={hasActiveFilters(filters)}
      />
    </div>
  );
}
