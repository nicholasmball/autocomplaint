-- Add "sent" status to complaints table
-- Allows users to self-report that they sent their complaint via mailto/clipboard

alter table complaints drop constraint if exists complaints_status_check;
alter table complaints add constraint complaints_status_check
  check (status in ('draft', 'generated', 'reviewed', 'delivered', 'sent'));
