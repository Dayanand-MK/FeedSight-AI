-- Additive schema for the browser PWA. Existing backend assessments are preserved.
create table if not exists public.feedsight_records (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object')
);
create index if not exists feedsight_records_owner_idx on public.feedsight_records(owner_id);
alter table public.feedsight_records enable row level security;
revoke all on public.feedsight_records from anon;
grant select, insert, update on public.feedsight_records to authenticated;
drop policy if exists "read own feed records" on public.feedsight_records;
create policy "read own feed records" on public.feedsight_records for select to authenticated using (auth.uid() = owner_id);
drop policy if exists "insert own feed records" on public.feedsight_records;
create policy "insert own feed records" on public.feedsight_records for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists "update own feed records" on public.feedsight_records;
create policy "update own feed records" on public.feedsight_records for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
