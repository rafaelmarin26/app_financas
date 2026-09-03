import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { HeaderNav, MobileTabBar } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { SupabaseSetupNotice } from "@/components/layout/supabase-setup-notice";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <SupabaseSetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já protege estas rotas; esta checagem é a segunda camada.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="mx-auto md:mx-0">
            <HeaderNav />
          </div>
          <div className="ml-auto">
            <UserMenu email={user.email ?? "Conta"} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:pt-8">
        {children}
      </main>

      <MobileTabBar />
    </div>
  );
}
