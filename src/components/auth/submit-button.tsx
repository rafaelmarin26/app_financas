"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  size = "lg",
  variant,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className} size={size} variant={variant}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel ?? "Aguarde…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
