import { Resend } from "resend";
import type { SendEmailInput } from "./types";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const fromName = process.env.RESEND_FROM_NAME || "AutoComplaint";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL environment variable is not set");
  }

  return { apiKey, fromEmail, fromName };
}

function letterToHtml(letterBody: string): string {
  const escaped = letterBody
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p style="margin: 0 0 1em 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
${paragraphs}
</body>
</html>`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ messageId: string }> {
  const { apiKey, fromEmail, fromName } = getConfig();
  const resend = new Resend(apiKey);

  const emailPayload: Parameters<typeof resend.emails.send>[0] = {
    from: `${fromName} <${fromEmail}>`,
    to: [input.recipientEmail],
    subject: input.subject,
    text: input.letterBody,
    html: letterToHtml(input.letterBody),
  };

  if (input.replyToEmail) {
    emailPayload.replyTo = [input.replyToEmail];
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        throw new Error(error.message);
      }

      return { messageId: data?.id || "" };
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except rate limits (429)
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        typeof (error as { statusCode: number }).statusCode === "number"
      ) {
        const code = (error as { statusCode: number }).statusCode;
        if (code >= 400 && code < 500 && code !== 429) {
          throw error;
        }
      }

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export type { SendEmailInput, SentComplaint, EmailStatus, ResendWebhookEvent } from "./types";
