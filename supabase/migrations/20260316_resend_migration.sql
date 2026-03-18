-- Rename sendgrid_message_id to resend_message_id in sent_complaints
ALTER TABLE sent_complaints
  RENAME COLUMN sendgrid_message_id TO resend_message_id;

-- Rename sendgrid_message_id to resend_message_id in email_events
ALTER TABLE email_events
  RENAME COLUMN sendgrid_message_id TO resend_message_id;

-- Update index names (drop old, create new)
DROP INDEX IF EXISTS idx_sent_complaints_sendgrid_message_id;
CREATE INDEX idx_sent_complaints_resend_message_id ON sent_complaints (resend_message_id);

DROP INDEX IF EXISTS idx_email_events_sendgrid_message_id;
CREATE INDEX idx_email_events_resend_message_id ON email_events (resend_message_id);
