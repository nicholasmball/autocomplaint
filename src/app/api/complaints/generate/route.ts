import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateComplaint,
  type ComplaintInput,
  type ComplaintCategory,
  type ComplaintTone,
  type RecipientType,
} from "@/services/complaint-generator";

const VALID_CATEGORIES: ComplaintCategory[] = [
  "billing",
  "poor-service",
  "faulty-product",
  "delivery",
  "contract-dispute",
  "data-privacy",
  "unfair-treatment",
  "accessibility",
];

const VALID_TONES: ComplaintTone[] = [
  "formal",
  "firm",
  "escalatory",
  "conciliatory",
];

const VALID_RECIPIENT_TYPES: RecipientType[] = ["company", "mp", "regulator"];

// Rate limit: max requests per user per hour
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_HOURS = 1;

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
  const { category, tone, recipientType, recipientName, description, desiredOutcome } = body as Record<string, string>;

  const missing = [];
  if (!category) missing.push("category");
  if (!tone) missing.push("tone");
  if (!recipientType) missing.push("recipientType");
  if (!recipientName) missing.push("recipientName");
  if (!description) missing.push("description");
  if (!desiredOutcome) missing.push("desiredOutcome");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate enum values
  if (!VALID_CATEGORIES.includes(category as ComplaintCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!VALID_TONES.includes(tone as ComplaintTone)) {
    return NextResponse.json(
      { error: `Invalid tone. Must be one of: ${VALID_TONES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!VALID_RECIPIENT_TYPES.includes(recipientType as RecipientType)) {
    return NextResponse.json(
      { error: `Invalid recipientType. Must be one of: ${VALID_RECIPIENT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Rate limiting: check recent usage
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { count, error: countError } = await supabase
    .from("complaint_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", windowStart);

  if (countError) {
    console.error("Rate limit check failed:", countError);
    // Don't block the request if the rate limit check fails
  } else if (count !== null && count >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} complaints per hour.`,
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429 }
    );
  }

  // Get user profile for name/address
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, address_line_1, address_line_2, city, county, postcode")
    .eq("id", user.id)
    .single();

  const userName =
    (body.userName as string) ||
    profile?.full_name ||
    user.email ||
    "Concerned Citizen";

  const userAddress =
    (body.userAddress as string) ||
    (profile
      ? [
          profile.address_line_1,
          profile.address_line_2,
          profile.city,
          profile.county,
          profile.postcode,
        ]
          .filter(Boolean)
          .join(", ")
      : undefined) ||
    undefined;

  // Build complaint input
  const complaintInput: ComplaintInput = {
    category: category as ComplaintCategory,
    tone: tone as ComplaintTone,
    recipientType: recipientType as RecipientType,
    recipientName: recipientName as string,
    description: description as string,
    desiredOutcome: desiredOutcome as string,
    userName,
    userAddress,
    previousContact: (body.previousContact as string) || undefined,
    referenceNumbers: (body.referenceNumbers as string) || undefined,
    dateOfIncident: (body.dateOfIncident as string) || undefined,
  };

  try {
    const result = await generateComplaint(complaintInput);

    // Log token usage to Supabase (fire-and-forget)
    supabase
      .from("complaint_usage_logs")
      .insert({
        user_id: user.id,
        category: result.category,
        tone: result.tone,
        recipient_type: complaintInput.recipientType,
        model: result.model,
        input_tokens: result.tokenUsage.input,
        output_tokens: result.tokenUsage.output,
        estimated_cost: result.tokenUsage.estimatedCost,
      })
      .then(({ error }) => {
        if (error) console.error("Failed to log usage:", error);
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Complaint generation failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to generate complaint. Please try again.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
