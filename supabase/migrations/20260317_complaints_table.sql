-- Complaints table: tracks all complaints regardless of delivery method
-- Implements R1 from Requirements

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('company', 'mp', 'regulator')),
  recipient_name text not null,
  recipient_email text not null default '',
  category text not null,
  tone text not null,
  description text not null,
  desired_outcome text not null,
  date_of_incident text,
  reference_numbers text,
  previous_contact text,
  generated_subject text,
  generated_letter text,
  status text not null default 'draft' check (status in ('draft', 'generated', 'reviewed', 'delivered')),
  delivery_method text check (delivery_method in ('mailto', 'clipboard', 'direct_email')),
  mp_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for dashboard queries (sorted by most recent)
create index idx_complaints_user_created on complaints(user_id, created_at desc);

-- RLS
alter table complaints enable row level security;

create policy "Users can view own complaints"
  on complaints for select
  using (auth.uid() = user_id);

create policy "Users can insert own complaints"
  on complaints for insert
  with check (auth.uid() = user_id);

create policy "Users can update own complaints"
  on complaints for update
  using (auth.uid() = user_id);

-- Updated_at trigger (reuses existing function from email_delivery migration)
create trigger set_complaints_updated_at
  before update on complaints
  for each row
  execute function update_updated_at_column();
