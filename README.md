# Saldo — Finanças Pessoais

Web app de gestão financeira pessoal: registre receitas e despesas, categorize,
acompanhe o dashboard do mês e exporte o que está filtrado em CSV.

Construído com **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Supabase (Auth + PostgreSQL + RLS) · Recharts**.

---

## 1. Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com os dados do seu projeto Supabase
npm run dev                        # http://localhost:3000
```

No Windows, dá para pular o terminal: **dê dois cliques em `iniciar-app.bat`**.
Ele instala as dependências na primeira vez, sobe o servidor e abre o navegador.

O app sobe mesmo sem credenciais: a landing page funciona e as telas de login e
do app mostram um aviso explicando o que falta configurar.

> **`localhost:3000` não é um site publicado.** É um servidor que roda no seu
> computador e só existe enquanto a janela do `npm run dev` (ou do
> `iniciar-app.bat`) estiver aberta. Ao fechar a janela, reiniciar ou desligar a
> máquina, o endereço passa a dar `ERR_CONNECTION_REFUSED` — isso é o
> comportamento normal, não uma falha. Basta subir de novo. Para um endereço que
> fica no ar sozinho, publique na Vercel (seção 3).

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (roda o TypeScript) |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm test` | Verificações da lógica pura (resumos, CSV, filtros, validação) |

## 2. Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria a tabela `transactions`, os índices, o trigger de `updated_at` e as
   quatro políticas de **Row Level Security**.

   > Se o banco já existia antes dos lançamentos recorrentes, rode também
   > [`supabase/migrations/0001_recorrencia.sql`](supabase/migrations/0001_recorrencia.sql).
   > As migrações são seguras para rodar mais de uma vez.
3. Em **Project Settings → API**, copie a *Project URL* e a *anon public key*
   para o `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Em **Authentication → URL Configuration**, adicione
   `http://localhost:3000/auth/callback` (e a URL da Vercel, depois do deploy)
   em *Redirect URLs*.

> Para testar sem confirmar e-mail, desligue **Authentication → Sign In / Up →
> Confirm email**. Com a opção ligada, o cadastro pede a confirmação por e-mail e
> o link cai em `/auth/callback`.

### Isolamento por usuário

Toda leitura e escrita passa pelas políticas de RLS (`auth.uid() = user_id`), ou
seja, **o banco** garante que cada pessoa só enxerga as próprias transações — não
o código do front-end. As Server Actions ainda filtram por `user_id` de forma
explícita, como segunda camada.

## 3. Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel (o preset Next.js é detectado sozinho).
3. Em **Settings → Environment Variables**, adicione as três variáveis do
   `.env.local`, com `NEXT_PUBLIC_SITE_URL` apontando para o domínio de produção.
4. Adicione `https://SEU-DOMINIO/auth/callback` nas *Redirect URLs* do Supabase.

---

## 4. Estrutura

```
src/
  app/
    page.tsx                  Landing page
    login/  cadastro/         Autenticação (Server Actions)
    auth/callback/            Troca o código do e-mail por sessão
    (app)/                    Área autenticada (layout com header + tabs mobile)
      dashboard/              Cards de resumo, donut e barras dos 6 meses
      transacoes/             Lista, filtros, busca, CRUD e exportação CSV
  components/
    ui/                       Primitivos shadcn/ui (Radix + Tailwind)
    dashboard/                SummaryCards, CategoryDonut, MonthlyBars
    transactions/             FilterBar, TransactionList, TransactionDialog, ExportCsvButton
    landing/  layout/  auth/
  lib/
    supabase/                 Clients de browser/servidor e revalidação de sessão
    actions/                  Server Actions de auth e de transações
    summary.ts  csv.ts        Agregações e geração do CSV (puros, testados)
    filters.ts  validation.ts Parsing da query string e validação de formulário
  proxy.ts                    Protege /dashboard e /transacoes, renova a sessão
supabase/schema.sql           Schema + RLS
tests/logic.test.ts           `npm test`
```

### Decisões de implementação

- **Server Components + Server Actions.** Não há rotas de API: as páginas leem do
  Supabase no servidor e o CRUD roda em Server Actions com `revalidatePath`.
- **Filtros na URL.** Mês, ano, categoria, tipo e busca vivem na query string, o
  que torna qualquer recorte compartilhável e recarregável. Valores inválidos
  caem no padrão em vez de quebrar a página.
- **CSV gerado no navegador**, a partir do mesmo conjunto já filtrado que está na
  tela — separador `;`, decimais com vírgula e BOM UTF-8, para o Excel em
  português abrir sem etapa de importação.
- **Datas sem fuso.** `date` é um `DATE` no Postgres e é formatado por
  manipulação de string, para "05/09" nunca virar "04/09" por causa de UTC.
- **Recorrência materializada.** Ao marcar "Repetir", os lançamentos da série são
  gravados de uma vez, como linhas normais amarradas por um `series_id`. Assim
  dashboard, filtros, busca e CSV continuam funcionando sem nenhum caso especial,
  e um mês em que a conta veio diferente pode ser editado sozinho.

## 5. Lançamentos recorrentes

Frequências: **semanal, quinzenal, mensal, bimestral, trimestral, semestral e
anual**. Ao criar, você escolhe a frequência e quantos lançamentos gerar (de 2 a
60); o formulário mostra a primeira e a última data antes de salvar.

A soma de meses preserva o dia e encurta para o último dia quando ele não existe,
sempre partindo da data original — então uma conta todo dia 31 cai em `31/01`,
`28/02`, `31/03`, sem a erosão de quem soma mês a mês. Está coberto por testes em
`tests/logic.test.ts`.

Ao editar ou excluir um lançamento de série, você escolhe entre **"Só este"** e
**"Este e os próximos"**. Na edição em série, descrição, valor, tipo e categoria
se propagam; a data alterada vale só para o lançamento aberto, porque os
seguintes têm datas próprias.

Para mudar a frequência de uma série já criada, exclua "este e os próximos" e
crie de novo — remarcar lançamentos existentes gera mais confusão do que ajuda.

## 6. Paleta dos gráficos

As cores dos gráficos não foram escolhidas no olho — foram validadas para
daltonismo e contraste nos dois temas (`--chart-*` em `src/app/globals.css`):

- **Donut de categorias:** rampa **ordinal de um único tom** (azul), do maior
  para o menor gasto. A cor codifica magnitude, não identidade — a identidade vem
  da lista ao lado, que rotula cada fatia com valor e percentual. O gráfico mostra
  no máximo 5 fatias; o excedente é agrupado em "Demais", porque acima disso as
  fatias deixam de ser comparáveis a olho.
- **Barras receitas × despesas:** verde `#008300` e vermelho `#e34948` (claro) /
  `#e66767` (escuro) — o par passa em separação para deuteranopia/protanopia e em
  contraste sobre as duas superfícies, e a posição fixa de cada barra no grupo
  reforça a identidade além da cor.

Se for trocar a paleta, revalide antes de subir.
