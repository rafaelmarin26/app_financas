import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormFeedback({
  tone,
  children,
  className,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        tone === "error"
          ? "border-destructive/25 bg-destructive/8 text-destructive"
          : "border-success/25 bg-success/10 text-success",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="text-pretty">{children}</span>
    </p>
  );
}
