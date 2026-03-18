-- Regulators table: UK regulators and ombudsmen with complaint contact details

create table if not exists regulators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null default '',
  sector text not null,
  complaint_email text not null default '',
  website text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigram index for autocomplete
create index if not exists idx_regulators_name_trgm on regulators using gin (name gin_trgm_ops);
create index if not exists idx_regulators_sector on regulators(sector);

-- Public read-only
alter table regulators enable row level security;

create policy "Anyone can read regulators"
  on regulators for select
  using (true);

create trigger set_regulators_updated_at
  before update on regulators
  for each row
  execute function update_updated_at_column();
