"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateTransaction } from "@/lib/validation";
import { seriesDates } from "@/lib/recurrence";
import type { ActionState } from "@/lib/actions/state";
import type { SeriesScope } from "@/lib/types";

function revalidate() {
  revalidatePath("/dashboard");
  revalidatePath("/transacoes");
}

async function requireUser() {
  if (!isSupabaseConfigured) {
    return { error: "Supabase não configurado. Preencha o .env.local." as const };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." as const };
  return { supabase, user };
}

function readScope(form: FormData): SeriesScope {
  return form.get("scope") === "future" ? "future" : "one";
}

/**
 * A coluna `series_id` só existe a partir da migração 0001. Se ela ainda não
 * foi aplicada, o Postgres devolve 42703 — vale traduzir, senão o usuário vê
 * uma mensagem interna do PostgREST.
 */
function describeError(message: string, code?: string) {
  if (code === "42703" || message.includes("series_id")) {
    return "O banco ainda não tem as colunas de recorrência. Rode supabase/migrations/0001_recorrencia.sql no SQL Editor do Supabase.";
  }
  return message;
}

export async function createTransaction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = validateTransaction(form);
  if (!parsed.ok) {
    return { status: "error", message: "Revise os campos destacados.", errors: parsed.errors };
  }

  const auth = await requireUser();
  if ("error" in auth) return { status: "error", message: auth.error };

  const { data, recurrence } = parsed;

  // Sem recorrência é um único registro; com recorrência, a série inteira vai
  // em um insert só, para não deixar metade dos lançamentos gravados.
  let rows: Record<string, unknown>[];

  if (recurrence === null) {
    rows = [{ ...data, user_id: auth.user.id }];
  } else {
    // Um mesmo series_id amarra todos os lançamentos gerados.
    const seriesId = crypto.randomUUID();
    const dates = seriesDates(data.date, recurrence.frequency, recurrence.occurrences);

    rows = dates.map((date, index) => ({
      ...data,
      date,
      user_id: auth.user.id,
      series_id: seriesId,
      recurrence: recurrence.frequency,
      series_index: index + 1,
      series_total: dates.length,
    }));
  }

  const { error } = await auth.supabase.from("transactions").insert(rows);
  if (error) return { status: "error", message: describeError(error.message, error.code) };

  revalidate();
  return {
    status: "success",
    message:
      rows.length > 1 ? `${rows.length} lançamentos criados.` : "Transação criada.",
  };
}

export async function updateTransaction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = String(form.get("id") ?? "");
  if (!id) return { status: "error", message: "Transação não encontrada." };

  const parsed = validateTransaction(form);
  if (!parsed.ok) {
    return { status: "error", message: "Revise os campos destacados.", errors: parsed.errors };
  }

  const auth = await requireUser();
  if ("error" in auth) return { status: "error", message: auth.error };

  const scope = readScope(form);
  const seriesId = String(form.get("seriesId") ?? "");
  const seriesIndex = Number(form.get("seriesIndex") ?? 0);

  // O filtro por user_id é redundante com a RLS, mas mantém a intenção explícita.
  if (scope === "future" && seriesId && Number.isInteger(seriesIndex)) {
    // Nas próximas ocorrências a data de cada uma é preservada — só os demais
    // campos acompanham a edição. A data digitada vale só para esta.
    const { date, ...shared } = parsed.data;

    const { error: futureError } = await auth.supabase
      .from("transactions")
      .update(shared)
      .eq("user_id", auth.user.id)
      .eq("series_id", seriesId)
      .gt("series_index", seriesIndex);

    if (futureError) {
      return { status: "error", message: describeError(futureError.message, futureError.code) };
    }

    const { error } = await auth.supabase
      .from("transactions")
      .update({ ...shared, date })
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) return { status: "error", message: describeError(error.message, error.code) };

    revalidate();
    return { status: "success", message: "Esta e as próximas foram atualizadas." };
  }

  const { error } = await auth.supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return { status: "error", message: describeError(error.message, error.code) };

  revalidate();
  return { status: "success", message: "Transação atualizada." };
}

export async function deleteTransaction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = String(form.get("id") ?? "");
  if (!id) return { status: "error", message: "Transação não encontrada." };

  const auth = await requireUser();
  if ("error" in auth) return { status: "error", message: auth.error };

  const scope = readScope(form);
  const seriesId = String(form.get("seriesId") ?? "");
  const seriesIndex = Number(form.get("seriesIndex") ?? 0);

  if (scope === "future" && seriesId && Number.isInteger(seriesIndex)) {
    const { error, count } = await auth.supabase
      .from("transactions")
      .delete({ count: "exact" })
      .eq("user_id", auth.user.id)
      .eq("series_id", seriesId)
      .gte("series_index", seriesIndex);

    if (error) return { status: "error", message: describeError(error.message, error.code) };

    revalidate();
    return { status: "success", message: `${count ?? 0} lançamentos excluídos.` };
  }

  const { error } = await auth.supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return { status: "error", message: describeError(error.message, error.code) };

  revalidate();
  return { status: "success", message: "Transação excluída." };
}
