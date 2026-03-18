-- Email delivery infrastructure tables
-- Per Requirements FR5

-- Sent complaints table
create table if not exists sent_complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  recipient_name text not null,
  recipient_type text not null check (recipient_type in ('company', 'mp', 'regulator')),
  subject text not null,
  letter_body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  sendgrid_message_id text,
  user_confirmed boolean not null default false,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for rate limiting queries and status lookups
create index idx_sent_complaints_user_sent_at on sent_complaints(user_id, sent_at);
create index idx_sent_complaints_sendgrid_message_id on sent_complaints(sendgrid_message_id);

-- RLS: users can only read their own sent complaints
alter table sent_complaints enable row level security;

create policy "Users can view own sent complaints"
  on sent_complaints for select
  using (auth.uid() = user_id);

create policy "Users can insert own sent complaints"
  on sent_complaints for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sent complaints"
  on sent_complaints for update
  using (auth.uid() = user_id);

-- Service role can do anything (for webhook processing)
-- Service role bypasses RLS by default, so no explicit policy needed.

-- Email events table (webhook audit trail)
create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  sendgrid_message_id text,
  event_type text not null,
  raw_payload jsonb not null,
  timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_email_events_sendgrid_message_id on email_events(sendgrid_message_id);
create index idx_email_events_event_type on email_events(event_type);

-- RLS: email_events are not user-accessible (service role only)
alter table email_events enable row level security;
-- No user policies — only service role (which bypasses RLS) can read/write.

-- Updated_at trigger for sent_complaints
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_sent_complaints_updated_at
  before update on sent_complaints
  for each row
  execute function update_updated_at_column();
