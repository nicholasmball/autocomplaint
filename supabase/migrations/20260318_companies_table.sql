-- Companies table: pre-seeded UK companies with complaint contact details

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text not null,
  complaint_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigram index for fast autocomplete search
create index if not exists idx_companies_name_trgm on companies using gin (name gin_trgm_ops);
create index if not exists idx_companies_sector on companies(sector);

-- Public read-only reference data
alter table companies enable row level security;

create policy "Anyone can read companies"
  on companies for select
  using (true);

create trigger set_companies_updated_at
  before update on companies
  for each row
  execute function update_updated_at_column();
