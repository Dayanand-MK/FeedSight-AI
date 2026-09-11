-- Only needed when using the separate legacy FastAPI -> assessments sync.
-- Does not create or replace the team's existing table.
alter table if exists public.assessments add column if not exists source text default 'legacy_unknown';
alter table if exists public.assessments alter column confidence drop not null;
