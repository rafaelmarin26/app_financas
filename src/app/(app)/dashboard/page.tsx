import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { MonthlyBars } from "@/components/dashboard/monthly-bars";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { categoryLabel } from "@/lib/categories";
import { parseFilters } from "@/lib/filters";
import { listAvailableYears, listRecentMonths, listTransactions } from "@/lib/transactions";
import { byCategory, monthlySeries, summarize } from "@/lib/summary";
import { formatCurrency, formatDate, monthLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function periodLabel(year: number | null, month: number | null) {
  if (year === null) return "Todo o período";
  if (month === null) return `Ano de ${year}`;
  return `${monthLabel(month)} de ${year}`;
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const filters = parseFilters(await searchParams);

  const [transactions, recent, years] = await Promise.all([
    listTransactions(filters),
    listRecentMonths(6),
    listAvailableYears(),
  ]);

  const summary = summarize(transactions);
  const expenseSlices = byCategory(transactions, "despesa");
  const series = monthlySeries(recent, 6);
  const latest = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${periodLabel(filters.year, filters.month)} · ${summary.count} lançamento(s)`}
        actions={<TransactionDialog />}
      />

      <FilterBar filters={filters} years={years} showSearch={false} showType={false} />

      <SummaryCards summary={summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDonut slices={expenseSlices} total={summary.expense} />
        <MonthlyBars data={series} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Últimos lançamentos</CardTitle>
            <CardDescription className="mt-1">
              Os cinco mais recentes do período filtrado.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/transacoes">
              Ver todos
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>

        {latest.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento neste período"
            description="Adicione uma transação ou mude o filtro de período acima."
            action={<TransactionDialog />}
          />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {latest.map((transaction) => {
              const isIncome = transaction.type === "receita";
              return (
                <li
                  key={transaction.id}
                  className="flex items-center gap-3 px-5 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{transaction.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {categoryLabel(transaction.category)} ·{" "}
                      <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      isIncome ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
