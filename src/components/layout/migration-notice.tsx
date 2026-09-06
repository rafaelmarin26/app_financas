import { Database } from "lucide-react";

/**
 * Aparece quando as leituras caíram no fallback por falta da migração 0001.
 * O app segue funcionando sem recorrência até o SQL ser aplicado.
 */
export function MigrationNotice() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
        <Database className="size-4 shrink-0" />
        Migração pendente: lançamentos recorrentes
      </p>
      <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
        O app está funcionando normalmente, mas sem a opção de repetir lançamentos.
        Para liberá-la, abra o <strong className="font-medium">SQL Editor</strong> do
        Supabase e rode o arquivo{" "}
        <code className="font-mono text-xs">supabase/migrations/0001_recorrencia.sql</code>.
        Depois recarregue esta página.
      </p>
    </div>
  );
}
