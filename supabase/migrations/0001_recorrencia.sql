-- =============================================================================
-- Migração 0001 — lançamentos recorrentes
--
-- Rode no SQL Editor do Supabase se você já tinha criado a tabela com o
-- schema.sql anterior. Em bancos novos o schema.sql já vem com estas colunas.
-- É seguro rodar mais de uma vez.
-- =============================================================================

alter table public.transactions
  add column if not exists series_id    uuid,
  add column if not exists recurrence   text,
  add column if not exists series_index integer,
  add column if not exists series_total integer;

comment on column public.transactions.series_id is
  'Agrupa os lançamentos gerados por uma mesma recorrência. Nulo em lançamentos avulsos.';
comment on column public.transactions.recurrence is
  'Frequência da série: semanal, quinzenal, mensal, bimestral, trimestral, semestral ou anual.';
comment on column public.transactions.series_index is
  'Posição do lançamento dentro da série, começando em 1.';
comment on column public.transactions.series_total is
  'Quantidade de lançamentos gerados na série.';

-- Os quatro campos andam juntos: ou o lançamento é avulso, ou é parte de série.
alter table public.transactions
  drop constraint if exists transactions_series_complete;
alter table public.transactions
  add constraint transactions_series_complete check (
    (series_id is null and recurrence is null
      and series_index is null and series_total is null)
    or
    (series_id is not null and recurrence is not null
      and series_index is not null and series_total is not null)
  );

alter table public.transactions
  drop constraint if exists transactions_recurrence_valid;
alter table public.transactions
  add constraint transactions_recurrence_valid check (
    recurrence is null or recurrence in (
      'semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual'
    )
  );

alter table public.transactions
  drop constraint if exists transactions_series_bounds;
alter table public.transactions
  add constraint transactions_series_bounds check (
    series_total is null
    or (series_total between 2 and 60 and series_index between 1 and series_total)
  );

-- Usado ao editar ou excluir "esta e as próximas" de uma série.
create index if not exists transactions_user_series_idx
  on public.transactions (user_id, series_id, series_index)
  where series_id is not null;
