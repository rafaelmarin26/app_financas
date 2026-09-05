import type { FieldErrors } from "@/lib/validation";

/**
 * Estado inicial e tipos das Server Actions.
 *
 * Vivem fora dos arquivos com "use server" porque um módulo de Server Actions
 * só pode exportar funções assíncronas — exportar uma constante dali quebra em
 * tempo de execução ("A 'use server' file can only export async functions").
 */

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialActionState: ActionState = { status: "idle" };

export type AuthState = {
  status: "idle" | "error" | "check-email";
  message?: string;
};

export const initialAuthState: AuthState = { status: "idle" };
