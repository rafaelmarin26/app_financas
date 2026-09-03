import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { SupabaseSetupNotice } from "@/components/layout/supabase-setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar sua conta"
      subtitle="Leva menos de um minuto. Depois é só registrar o primeiro lançamento."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured ? <SupabaseSetupNotice className="mb-4" /> : null}
      <SignupForm />
    </AuthShell>
  );
}
