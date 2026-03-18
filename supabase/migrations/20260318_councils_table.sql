-- Councils table: UK local councils with complaint contact details

create table if not exists councils (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  council_type text not null check (council_type in ('county', 'district', 'unitary', 'metropolitan', 'london_borough')),
  region text not null default '',
  complaint_email text not null default '',
  website text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable pg_trgm for fuzzy search
create extension if not exists pg_trgm;

-- Trigram index for autocomplete
create index if not exists idx_councils_name_trgm on councils using gin (name gin_trgm_ops);
create index if not exists idx_councils_type on councils(council_type);

-- Public read-only
alter table councils enable row level security;

create policy "Anyone can read councils"
  on councils for select
  using (true);

create trigger set_councils_updated_at
  before update on councils
  for each row
  execute function update_updated_at_column();
