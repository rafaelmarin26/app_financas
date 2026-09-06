"use client";

import { useActionState, useState } from "react";
import { MoreHorizontal, Pencil, ReceiptText, Repeat, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { categoryLabel } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/utils";
import { frequencyLabel } from "@/lib/recurrence";
import { deleteTransaction } from "@/lib/actions/transactions";
import { initialActionState, type ActionState } from "@/lib/actions/state";
import type { SeriesScope, Transaction } from "@/lib/types";

function DeleteDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [scope, setScope] = useState<SeriesScope>("one");
  const isSeries = Boolean(transaction.series_id);
  const remaining =
    (transaction.series_total ?? 0) - (transaction.series_index ?? 0) + 1;

  const [state, formAction] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await deleteTransaction(prev, form);
      if (result.status === "success") onOpenChange(false);
      return result;
    },
    initialActionState,
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSeries ? "Excluir lançamento da série?" : "Excluir esta transação?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{transaction.description}</span> —{" "}
            {formatCurrency(transaction.amount)} em {formatDate(transaction.date)}. Esta ação
            não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isSeries ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              {(
                [
                  ["one", "Só este"],
                  ["future", "Este e os próximos"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  aria-pressed={scope === value}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 " +
                    (scope === value
                      ? "bg-card shadow-xs"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {scope === "future"
                ? `Serão excluídos ${remaining} lançamentos, deste em diante.`
                : `Os outros ${(transaction.series_total ?? 1) - 1} lançamentos da série continuam.`}
            </p>
          </div>
        ) : null}

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={transaction.id} />
            <input type="hidden" name="scope" value={scope} />
            {isSeries ? (
              <>
                <input type="hidden" name="seriesId" value={transaction.series_id!} />
                <input type="hidden" name="seriesIndex" value={transaction.series_index!} />
              </>
            ) : null}
            <AlertDialogAction type="submit">Excluir</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isIncome = transaction.type === "receita";

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transaction.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Badge variant={isIncome ? "success" : "destructive"}>
            {isIncome ? "Receita" : "Despesa"}
          </Badge>
          <span>{categoryLabel(transaction.category)}</span>
          <span aria-hidden>·</span>
          <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
          {transaction.series_id ? (
            <span
              className="inline-flex items-center gap-1"
              title={`Série ${frequencyLabel(transaction.recurrence ?? "")}`}
            >
              <span aria-hidden>·</span>
              <Repeat className="size-3" />
              {frequencyLabel(transaction.recurrence ?? "")} {transaction.series_index}/
              {transaction.series_total}
            </span>
          ) : null}
        </div>
      </div>

      <p
        className={`shrink-0 text-sm font-semibold tabular-nums sm:text-base ${
          isIncome ? "text-success" : "text-destructive"
        }`}
      >
        {isIncome ? "+" : "−"}
        {formatCurrency(transaction.amount)}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            aria-label={`Ações para ${transaction.description}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Montados só quando abertos para não criar N diálogos por página. */}
      {editing ? (
        <TransactionDialog
          transaction={transaction}
          open={editing}
          onOpenChange={setEditing}
        />
      ) : null}
      {deleting ? (
        <DeleteDialog
          transaction={transaction}
          open={deleting}
          onOpenChange={setDeleting}
        />
      ) : null}
    </li>
  );
}

export function TransactionList({
  transactions,
  isFiltered,
}: {
  transactions: Transaction[];
  isFiltered: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ReceiptText className="size-5" />}
          title={isFiltered ? "Nenhuma transação encontrada" : "Nenhuma transação ainda"}
          description={
            isFiltered
              ? "Tente ampliar o período ou limpar os filtros aplicados."
              : "Registre sua primeira receita ou despesa para começar a acompanhar o mês."
          }
          action={!isFiltered ? <TransactionDialog /> : null}
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {transactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </ul>
    </Card>
  );
}
