-- =============================================================================
-- Finanças Pessoais — schema + Row Level Security
-- Rode este script no SQL Editor do Supabase (uma vez, em um projeto novo).
-- =============================================================================

create extension if not exists "pgcrypto";

-- Tipo da transação -----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('receita', 'despesa');
  end if;
end
$$;

-- Tabela ----------------------------------------------------------------------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 120),
  amount      numeric(12, 2) not null check (amount > 0),
  date        date not null,
  type        public.transaction_type not null,
  category    text not null check (
                category in (
                  'alimentacao','transporte','moradia','lazer','saude',
                  'educacao','salario','freelance','outros'
                )
              ),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Recorrência: os quatro campos são nulos em lançamentos avulsos e
  -- preenchidos juntos nos que fazem parte de uma série.
  series_id    uuid,
  recurrence   text,
  series_index integer,
  series_total integer,

  constraint transactions_series_complete check (
    (series_id is null and recurrence is null
      and series_index is null and series_total is null)
    or
    (series_id is not null and recurrence is not null
      and series_index is not null and series_total is not null)
  ),
  constraint transactions_recurrence_valid check (
    recurrence is null or recurrence in (
      'semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual'
    )
  ),
  constraint transactions_series_bounds check (
    series_total is null
    or (series_total between 2 and 60 and series_index between 1 and series_total)
  )
);

-- Índices usados pelos filtros do dashboard e da listagem.
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category);

-- Usado ao editar ou excluir "esta e as próximas" de uma série.
create index if not exists transactions_user_series_idx
  on public.transactions (user_id, series_id, series_index)
  where series_id is not null;

-- updated_at automático --------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- Row Level Security -----------------------------------------------------------
-- Cada usuário só enxerga e manipula as próprias transações.
alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = user_id);
