import Link from "next/link";
import {
  ArrowRight,
  Download,
  Filter,
  LayoutDashboard,
  PieChart,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard consolidado",
    description:
      "Receita total, despesa total e saldo do período em cards que você entende num relance.",
  },
  {
    icon: PieChart,
    title: "Gráficos por categoria",
    description:
      "Pizza de gastos por categoria e evolução dos últimos meses para achar o vazamento.",
  },
  {
    icon: Wallet,
    title: "Lançamentos rápidos",
    description:
      "Criar, editar e excluir receitas e despesas em segundos, com nove categorias prontas.",
  },
  {
    icon: Filter,
    title: "Busca e filtros",
    description:
      "Filtre por mês, ano, tipo e categoria — ou busque direto pela descrição do lançamento.",
  },
  {
    icon: Download,
    title: "Exportação em CSV",
    description:
      "Baixe exatamente o que está filtrado, já formatado para abrir no Excel sem ajustes.",
  },
  {
    icon: Smartphone,
    title: "Feito para o celular",
    description:
      "Layout responsivo de verdade: a mesma experiência no desktop e na tela pequena.",
  },
];

const STEPS = [
  {
    title: "Crie sua conta",
    description: "E-mail e senha. Sem cartão, sem integração bancária, sem burocracia.",
  },
  {
    title: "Registre o que entra e o que sai",
    description: "Descrição, valor, data, tipo e categoria. Cinco campos e pronto.",
  },
  {
    title: "Acompanhe e exporte",
    description: "O dashboard atualiza sozinho e o relatório sai em CSV quando você quiser.",
  },
];

const STATS = [
  { value: "9", label: "categorias prontas" },
  { value: "5", label: "campos por lançamento" },
  { value: "1 clique", label: "para exportar CSV" },
];

export default async function LandingPage() {
  let isLoggedIn = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="#recursos">Recursos</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="#como-funciona">Como funciona</Link>
            </Button>
            {isLoggedIn ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Ir para o app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/cadastro">Criar conta</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero -------------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" />
                Seus dados isolados por Row Level Security
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                Suas finanças em um lugar só —{" "}
                <span className="text-primary">e finalmente claras</span>.
              </h1>

              <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
                Chega de planilha manual e extrato espalhado. Registre receitas e despesas,
                categorize, veja para onde o dinheiro está indo e exporte o relatório quando
                precisar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={isLoggedIn ? "/dashboard" : "/cadastro"}>
                    {isLoggedIn ? "Abrir meu dashboard" : "Começar de graça"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#recursos">Ver os recursos</Link>
                </Button>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-xl font-semibold tracking-tight">{stat.value}</dt>
                    <dd className="mt-0.5 text-xs text-muted-foreground">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:pl-4">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Recursos ---------------------------------------------------------- */}
        <section id="recursos" className="scroll-mt-16 border-t border-border bg-card/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Recursos</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Tudo o que um controle financeiro pessoal precisa ter
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Nada além disso. O objetivo é você abrir, entender sua situação e fechar.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-4.5" />
                  </span>
                  <h3 className="mt-4 font-medium">{feature.title}</h3>
                  <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Como funciona ----------------------------------------------------- */}
        <section id="como-funciona" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Como funciona</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Três passos até enxergar seu mês
              </h2>
            </div>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative pl-12">
                  <span className="absolute left-0 top-0 grid size-8 place-items-center rounded-full border border-border bg-card text-sm font-semibold">
                    {index + 1}
                  </span>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA final --------------------------------------------------------- */}
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm sm:flex-row sm:items-center sm:p-10">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Comece pelo próximo lançamento
                </h2>
                <p className="mt-2 max-w-lg text-pretty text-sm text-muted-foreground">
                  Leva menos de um minuto para criar a conta e registrar a primeira despesa.
                </p>
              </div>
              <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
                <Link href={isLoggedIn ? "/dashboard" : "/cadastro"}>
                  {isLoggedIn ? "Abrir meu dashboard" : "Criar minha conta"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Projeto de estudo — Next.js, Supabase e Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
