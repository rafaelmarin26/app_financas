import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mostrado quando as variáveis do Supabase ainda não foram preenchidas. */
export function SupabaseSetupNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
        <AlertTriangle className="size-4 shrink-0" />
        Supabase ainda não configurado
      </p>
      <p className="mt-1.5 text-pretty text-muted-foreground">
        Copie <code className="font-mono text-xs">.env.local.example</code> para{" "}
        <code className="font-mono text-xs">.env.local</code>, preencha a URL e a anon key
        do seu projeto e rode <code className="font-mono text-xs">supabase/schema.sql</code>{" "}
        no SQL Editor.
      </p>
    </div>
  );
}
