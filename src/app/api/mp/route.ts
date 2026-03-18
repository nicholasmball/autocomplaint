import { NextRequest, NextResponse } from "next/server";
import { lookupMP } from "@/services/mp-lookup";
import { MPLookupError } from "@/services/mp-lookup/types";

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode");

  if (!postcode || postcode.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: postcode" },
      { status: 400 }
    );
  }

  // Basic input sanitization — strip anything that isn't alphanumeric or space
  const sanitized = postcode.replace(/[^a-zA-Z0-9\s]/g, "").trim();

  if (sanitized.length === 0) {
    return NextResponse.json(
      { error: "Invalid postcode format" },
      { status: 400 }
    );
  }

  try {
    const result = await lookupMP(sanitized);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MPLookupError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Unexpected error in MP lookup:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        code: "UPSTREAM_ERROR",
      },
      { status: 500 }
    );
  }
}
