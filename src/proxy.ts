import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Roda antes de cada navegação: revalida a sessão do Supabase, renova os
 * cookies e protege /dashboard e /transacoes. (Em Next 16 este arquivo
 * substitui o antigo `middleware.ts`.)
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
