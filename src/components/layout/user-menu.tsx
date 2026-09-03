"use client";

import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

export function UserMenu({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary/15 focus-visible:ring-[3px] focus-visible:ring-ring/40"
        aria-label="Menu da conta"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex items-start gap-2 font-normal">
          <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Conectado como</span>
            <span className="block truncate text-sm font-medium">{email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem variant="destructive" asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="size-4" />
              Sair da conta
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
