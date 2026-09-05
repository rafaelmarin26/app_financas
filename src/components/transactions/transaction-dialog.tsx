"use client";

import { useActionState, useId, useState } from "react";
import { Plus } from "lucide-react";

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
import { todayISO } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/types";
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
  const fieldId = useId();

  // Ao reabrir, volta aos valores originais (ou aos padrões, na criação).
  function onOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChangeProp?.(next);
    if (next) {
      setType(transaction?.type ?? defaultType);
      setCategory(transaction?.category ?? "");
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
                defaultValue={transaction?.date ?? todayISO()}
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

