"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateTransaction } from "@/lib/validation";
import type { ActionState } from "@/lib/actions/state";

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

  const { error } = await auth.supabase
    .from("transactions")
    .insert({ ...parsed.data, user_id: auth.user.id });

  if (error) return { status: "error", message: error.message };

  revalidate();
  return { status: "success", message: "Transação criada." };
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

  // O filtro por user_id é redundante com a RLS, mas mantém a intenção explícita.
  const { error } = await auth.supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return { status: "error", message: error.message };

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

  const { error } = await auth.supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return { status: "error", message: error.message };

  revalidate();
  return { status: "success", message: "Transação excluída." };
}
