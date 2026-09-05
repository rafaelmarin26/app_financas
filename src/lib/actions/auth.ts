"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthState } from "@/lib/actions/state";

/** Mensagens do Supabase Auth traduzidas para o usuário final. */
function translateAuthError(message: string) {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "User already registered": "Já existe uma conta com este e-mail.",
    "Password should be at least 6 characters":
      "A senha precisa ter pelo menos 6 caracteres.",
    "Signup requires a valid password": "Informe uma senha válida.",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  };
  return map[message] ?? message;
}

function readCredentials(form: FormData) {
  return {
    email: String(form.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(form.get("password") ?? ""),
  };
}

async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Supabase não configurado. Preencha o .env.local." };
  }

  const { email, password } = readCredentials(form);
  if (!email || !password) {
    return { status: "error", message: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { status: "error", message: translateAuthError(error.message) };

  const redirectTo = String(form.get("redirectTo") ?? "");
  // Só aceita caminhos internos — evita open redirect via query string.
  const target = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/dashboard";

  redirect(target);
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Supabase não configurado. Preencha o .env.local." };
  }

  const { email, password } = readCredentials(form);
  const confirm = String(form.get("confirm") ?? "");

  if (!email) return { status: "error", message: "Informe seu e-mail." };
  if (password.length < 6) {
    return { status: "error", message: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (password !== confirm) {
    return { status: "error", message: "As senhas não conferem." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });

  if (error) return { status: "error", message: translateAuthError(error.message) };

  // Com "Confirm email" ligado no Supabase não há sessão logo após o cadastro.
  if (!data.session) {
    return {
      status: "check-email",
      message: "Enviamos um link de confirmação para o seu e-mail.",
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
