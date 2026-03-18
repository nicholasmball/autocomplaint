import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, isValidEmail } from "@/services/email";
import type { RecipientType } from "@/services/complaint-generator/types";

const VALID_RECIPIENT_TYPES: RecipientType[] = ["company", "mp", "regulator"];

// Rate limits per Requirements FR3
const HOURLY_LIMIT = 5;
const DAILY_LIMIT = 20;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate required fields
  const {
    recipientEmail,
    recipientName,
    recipientType,
    subject,
    letterBody,
    userConfirmed,
  } = body as Record<string, string | boolean>;

  const missing = [];
  if (!recipientEmail) missing.push("recipientEmail");
  if (!recipientName) missing.push("recipientName");
  if (!recipientType) missing.push("recipientType");
  if (!subject) missing.push("subject");
  if (!letterBody) missing.push("letterBody");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  if (!isValidEmail(recipientEmail as string)) {
    return NextResponse.json(
      { error: "Invalid recipient email address", code: "INVALID_EMAIL" },
      { status: 400 }
    );
  }

  if (
    !VALID_RECIPIENT_TYPES.includes(recipientType as RecipientType)
  ) {
    return NextResponse.json(
      {
        error: `Invalid recipientType. Must be one of: ${VALID_RECIPIENT_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Rate limiting: hourly (exclude failed sends so users can retry)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourlyCount, error: hourlyError } = await supabase
    .from("sent_complaints")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("sent_at", hourAgo)
    .in("status", ["pending", "sent", "delivered"]);

  if (hourlyError) {
    console.error("Hourly rate limit check failed:", hourlyError);
  } else if (hourlyCount !== null && hourlyCount >= HOURLY_LIMIT) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Maximum ${HOURLY_LIMIT} emails per hour.`,
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429 }
    );
  }

  // Rate limiting: daily (exclude failed sends so users can retry)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyCount, error: dailyError } = await supabase
    .from("sent_complaints")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("sent_at", dayAgo)
    .in("status", ["pending", "sent", "delivered"]);

  if (dailyError) {
    console.error("Daily rate limit check failed:", dailyError);
  } else if (dailyCount !== null && dailyCount >= DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Maximum ${DAILY_LIMIT} emails per day.`,
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429 }
    );
  }

  // Get user's email for Reply-To
  const replyToEmail = user.email || undefined;

  // Insert pending record
  const { data: sentComplaint, error: insertError } = await supabase
    .from("sent_complaints")
    .insert({
      user_id: user.id,
      recipient_email: recipientEmail as string,
      recipient_name: recipientName as string,
      recipient_type: recipientType as string,
      subject: subject as string,
      letter_body: letterBody as string,
      status: "pending",
      user_confirmed: userConfirmed === true,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create sent_complaint record:", insertError);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }

  // Send the email
  try {
    const { messageId } = await sendEmail({
      recipientEmail: recipientEmail as string,
      recipientName: recipientName as string,
      recipientType: recipientType as RecipientType,
      subject: subject as string,
      letterBody: letterBody as string,
      replyToEmail,
      userConfirmed: userConfirmed === true,
    });

    // Update record with message ID and status
    const { data: updated, error: updateError } = await supabase
      .from("sent_complaints")
      .update({
        status: "sent",
        resend_message_id: messageId,
      })
      .eq("id", sentComplaint.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update sent_complaint status:", updateError);
    }

    return NextResponse.json(updated || { ...sentComplaint, status: "sent", resend_message_id: messageId });
  } catch (error) {
    console.error("Email sending failed:", error);

    // Update record as failed
    await supabase
      .from("sent_complaints")
      .update({ status: "failed" })
      .eq("id", sentComplaint.id);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to send email. Please try again.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
