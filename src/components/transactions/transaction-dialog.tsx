"use client";

import { useActionState, useId, useState } from "react";
import { Plus, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFeedback } from "@/components/auth/form-feedback";
import { SubmitButton } from "@/components/auth/submit-button";
import { categoriesForType } from "@/lib/categories";
import { formatDate, todayISO } from "@/lib/utils";
import {
  FREQUENCIES,
  NO_RECURRENCE,
  clampCount,
  defaultCountFor,
  frequencyLabel,
  occurrenceDate,
  MAX_OCCURRENCES,
  MIN_OCCURRENCES,
  type Frequency,
} from "@/lib/recurrence";
import type { SeriesScope, Transaction, TransactionType } from "@/lib/types";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { initialActionState, type ActionState } from "@/lib/actions/state";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function TransactionDialog({
  transaction,
  trigger,
  defaultType = "despesa",
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  transaction?: Transaction;
  trigger?: React.ReactNode;
  defaultType?: TransactionType;
  /** Passe `open`/`onOpenChange` para controlar o diálogo de fora (ex.: menu de ações). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(transaction);
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const [type, setType] = useState<TransactionType>(transaction?.type ?? defaultType);
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayISO());
  const [recurrence, setRecurrence] = useState<string>(NO_RECURRENCE);
  const [occurrences, setOccurrences] = useState(defaultCountFor("mensal"));
  const [scope, setScope] = useState<SeriesScope>("one");
  const fieldId = useId();

  // Recorrência só é oferecida na criação: mexer na frequência de uma série já
  // gravada significaria remarcar lançamentos existentes, o que confunde mais
  // do que ajuda. Para mudar a frequência, exclua a série e crie de novo.
  const isSeries = Boolean(transaction?.series_id);

  // Ao reabrir, volta aos valores originais (ou aos padrões, na criação).
  function onOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChangeProp?.(next);
    if (next) {
      setType(transaction?.type ?? defaultType);
      setCategory(transaction?.category ?? "");
      setDate(transaction?.date ?? todayISO());
      setRecurrence(NO_RECURRENCE);
      setOccurrences(defaultCountFor("mensal"));
      setScope("one");
    }
  }

  const submit = isEdit ? updateTransaction : createTransaction;
  const [state, formAction] = useActionState(
    // Fechar aqui (e não em um efeito) evita o render extra do ciclo do useEffect.
    async (prev: ActionState, form: FormData) => {
      const result = await submit(prev, form);
      if (result.status === "success") onOpenChange(false);
      return result;
    },
    initialActionState,
  );

  // Prévia da série: primeira e última data, para o usuário conferir antes de salvar.
  const preview =
    !isEdit && recurrence !== NO_RECURRENCE && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? (() => {
          const count = clampCount(occurrences);
          return {
            count,
            first: formatDate(date),
            last: formatDate(occurrenceDate(date, recurrence as Frequency, count - 1)),
          };
        })()
      : null;

  const options = categoriesForType(type);
  // Se o tipo mudou e a categoria escolhida não vale mais, o Select fica vazio.
  const categoryValue = options.some((option) => option.value === category) ? category : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isControlled && trigger === undefined ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" />
              Nova transação
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ajuste os dados do lançamento e salve."
              : "Registre uma receita ou uma despesa em cinco campos."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEdit ? <input type="hidden" name="id" value={transaction!.id} /> : null}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="category" value={categoryValue} />
          <input type="hidden" name="recurrence" value={isEdit ? NO_RECURRENCE : recurrence} />
          <input type="hidden" name="occurrences" value={occurrences} />
          <input type="hidden" name="scope" value={scope} />
          {isSeries ? (
            <>
              <input type="hidden" name="seriesId" value={transaction!.series_id!} />
              <input type="hidden" name="seriesIndex" value={transaction!.series_index!} />
            </>
          ) : null}

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {(["receita", "despesa"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                aria-pressed={type === option}
                className={
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 " +
                  (type === option
                    ? option === "receita"
                      ? "bg-card text-success shadow-xs"
                      : "bg-card text-destructive shadow-xs"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {option === "receita" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-description`}>Descrição</Label>
            <Input
              id={`${fieldId}-description`}
              name="description"
              defaultValue={transaction?.description}
              placeholder="Ex.: Mercado do mês"
              maxLength={120}
              aria-invalid={Boolean(state.errors?.description)}
              aria-describedby={`${fieldId}-description-error`}
              required
            />
            <FieldError
              id={`${fieldId}-description-error`}
              message={state.errors?.description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-amount`}>Valor (R$)</Label>
              <Input
                id={`${fieldId}-amount`}
                name="amount"
                inputMode="decimal"
                defaultValue={transaction ? String(transaction.amount).replace(".", ",") : ""}
                placeholder="0,00"
                aria-invalid={Boolean(state.errors?.amount)}
                aria-describedby={`${fieldId}-amount-error`}
                required
              />
              <FieldError id={`${fieldId}-amount-error`} message={state.errors?.amount} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-date`}>Data</Label>
              <Input
                id={`${fieldId}-date`}
                name="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-invalid={Boolean(state.errors?.date)}
                aria-describedby={`${fieldId}-date-error`}
                required
              />
              <FieldError id={`${fieldId}-date-error`} message={state.errors?.date} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-category`}>Categoria</Label>
            <Select value={categoryValue} onValueChange={setCategory}>
              <SelectTrigger id={`${fieldId}-category`} aria-invalid={Boolean(state.errors?.category)}>
                <SelectValue placeholder="Escolha uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id={`${fieldId}-category-error`} message={state.errors?.category} />
          </div>

          {!isEdit ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label
                  htmlFor={`${fieldId}-recurrence`}
                  className="flex items-center gap-2"
                >
                  <Repeat className="size-4 text-muted-foreground" />
                  Repetir
                </Label>
                <Select
                  value={recurrence}
                  onValueChange={(value) => {
                    setRecurrence(value);
                    if (value !== NO_RECURRENCE) setOccurrences(defaultCountFor(value));
                  }}
                >
                  <SelectTrigger id={`${fieldId}-recurrence`} className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_RECURRENCE}>Não se repete</SelectItem>
                    {FREQUENCIES.map((frequency) => (
                      <SelectItem key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recurrence !== NO_RECURRENCE ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label
                      htmlFor={`${fieldId}-occurrences`}
                      className="text-muted-foreground"
                    >
                      Quantos lançamentos
                    </Label>
                    <Input
                      id={`${fieldId}-occurrences`}
                      type="number"
                      inputMode="numeric"
                      min={MIN_OCCURRENCES}
                      max={MAX_OCCURRENCES}
                      value={occurrences}
                      onChange={(event) => setOccurrences(Number(event.target.value))}
                      onBlur={(event) => setOccurrences(clampCount(Number(event.target.value)))}
                      aria-invalid={Boolean(state.errors?.occurrences)}
                      className="h-8 w-20"
                    />
                  </div>

                  {preview ? (
                    <p className="text-pretty text-xs text-muted-foreground">
                      Serão criados <strong className="font-medium text-foreground">
                        {preview.count} lançamentos
                      </strong>{" "}
                      de mesmo valor, de {preview.first} até {preview.last}.
                    </p>
                  ) : null}

                  <FieldError
                    id={`${fieldId}-occurrences-error`}
                    message={state.errors?.occurrences ?? state.errors?.recurrence}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {isEdit && isSeries ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="flex items-start gap-2 text-sm">
                <Repeat className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-pretty">
                  Parte de uma série{" "}
                  <strong className="font-medium">
                    {frequencyLabel(transaction!.recurrence ?? "")}
                  </strong>{" "}
                  — lançamento {transaction!.series_index} de {transaction!.series_total}.
                </span>
              </p>

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

              {scope === "future" ? (
                <p className="text-pretty text-xs text-muted-foreground">
                  Descrição, valor, tipo e categoria são aplicados a este e aos próximos.
                  A data alterada vale só para este lançamento — os próximos mantêm as
                  datas deles.
                </p>
              ) : null}
            </div>
          ) : null}

          {state.status === "error" && state.message ? (
            <FormFeedback tone="error">{state.message}</FormFeedback>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton pendingLabel="Salvando…">
              {isEdit ? "Salvar alterações" : "Adicionar transação"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

