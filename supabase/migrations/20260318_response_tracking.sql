-- Response tracking: adds fields to complaints table for tracking recipient responses

alter table complaints add column if not exists response_status text
  default 'awaiting' check (response_status in ('awaiting', 'responded', 'no_response', 'escalated', 'resolved'));

alter table complaints add column if not exists response_date timestamptz;
alter table complaints add column if not exists response_summary text;
alter table complaints add column if not exists response_satisfactory boolean;
alter table complaints add column if not exists follow_up_date timestamptz;
alter table complaints add column if not exists escalated_to text;

create index if not exists idx_complaints_response_status on complaints(user_id, response_status);
