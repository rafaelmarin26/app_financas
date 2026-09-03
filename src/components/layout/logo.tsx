import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 rounded-md",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" strokeWidth="2.2">
          <path
            d="M4 16.5 9 11l3.5 3.5L20 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M15 7h5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {showWordmark ? <span className="text-[15px]">Saldo</span> : null}
      <span className="sr-only">Saldo — finanças pessoais</span>
    </Link>
  );
}
