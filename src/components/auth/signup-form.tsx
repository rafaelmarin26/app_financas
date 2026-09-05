"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFeedback } from "@/components/auth/form-feedback";
import { SubmitButton } from "@/components/auth/submit-button";
import { signUp } from "@/lib/actions/auth";
import { initialAuthState } from "@/lib/actions/state";

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialAuthState);

  if (state.status === "check-email") {
    return (
      <div className="space-y-4">
        <FormFeedback tone="success">{state.message}</FormFeedback>
        <p className="text-sm text-muted-foreground">
          Abra o link que enviamos para confirmar a conta. Depois disso é só entrar
          normalmente.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 6 caracteres"
          minLength={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          minLength={6}
          required
        />
      </div>

      {state.status === "error" && state.message ? (
        <FormFeedback tone="error">{state.message}</FormFeedback>
      ) : null}

      <SubmitButton className="w-full" pendingLabel="Criando conta…">
        Criar conta
      </SubmitButton>
    </form>
  );
}
