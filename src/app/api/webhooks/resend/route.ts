import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Webhook } from "svix";
import type { ResendWebhookEvent, EmailStatus } from "@/services/email/types";

const EVENT_TO_STATUS: Record<string, EmailStatus> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.delivery_delayed": "sent",
  "email.complained": "bounced",
};

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  const rawBody = await request.text();

  // Verify signature if secret is configured
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id") || "";
    const svixTimestamp = request.headers.get("svix-timestamp") || "";
    const svixSignature = request.headers.get("svix-signature") || "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  // Parse event
  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Create admin Supabase client (service role) for webhook processing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase config for webhook processing");
    // Return 200 to prevent Resend retries
    return NextResponse.json({ received: true });
  }

  const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });

  try {
    const resendMessageId = event.data.email_id;
    const newStatus = EVENT_TO_STATUS[event.type];

    // Store raw event in email_events table
    await supabase.from("email_events").insert({
      event_type: event.type,
      resend_message_id: resendMessageId,
      raw_payload: event,
      timestamp: event.created_at,
    });

    // Update sent_complaint status if this is a status-changing event
    if (newStatus && resendMessageId) {
      await supabase
        .from("sent_complaints")
        .update({ status: newStatus })
        .eq("resend_message_id", resendMessageId);
    }
  } catch (error) {
    // Log but don't fail — we return 200 to prevent Resend retries
    console.error("Failed to process webhook event:", error, event);
  }

  return NextResponse.json({ received: true });
}
