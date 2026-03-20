-- Scraper runs table: tracks history of automated and manual scraper executions

create table if not exists scraper_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  total_processed int not null default 0,
  updated_count int not null default 0,
  error_count int not null default 0,
  results jsonb not null default '[]'::jsonb,
  trigger text not null check (trigger in ('manual', 'cron')),
  created_at timestamptz not null default now()
);

-- Index for fetching recent runs
create index if not exists idx_scraper_runs_started_at on scraper_runs(started_at desc);

-- RLS: only authenticated users can read
alter table scraper_runs enable row level security;

create policy "Authenticated users can read scraper runs"
  on scraper_runs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert scraper runs"
  on scraper_runs for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update scraper runs"
  on scraper_runs for update
  using (auth.role() = 'authenticated');
