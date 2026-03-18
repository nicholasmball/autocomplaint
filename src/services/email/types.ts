import type { RecipientType } from "@/services/complaint-generator/types";

export type EmailStatus = "pending" | "sent" | "delivered" | "bounced" | "failed";

export interface SendEmailInput {
  recipientEmail: string;
  recipientName: string;
  recipientType: RecipientType;
  subject: string;
  letterBody: string;
  replyToEmail?: string;
  userConfirmed: boolean;
}

export interface SentComplaint {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  recipient_type: RecipientType;
  subject: string;
  letter_body: string;
  status: EmailStatus;
  resend_message_id: string | null;
  user_confirmed: boolean;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: unknown;
  };
}
