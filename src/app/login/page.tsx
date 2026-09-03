import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormFeedback } from "@/components/auth/form-feedback";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseSetupNotice } from "@/components/layout/supabase-setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const redirectTo = typeof params.redirectTo === "string" ? params.redirectTo : undefined;
  const linkError = params.erro === "link-invalido";

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para ver o resumo do seu mês e continuar seus lançamentos."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured ? <SupabaseSetupNotice className="mb-4" /> : null}
      {linkError ? (
        <FormFeedback tone="error" className="mb-4">
          O link de confirmação expirou ou já foi usado. Tente entrar novamente.
        </FormFeedback>
      ) : null}
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
