import type {
  MPLookupResponse,
  MPLookupResult,
  PostcodesIOResponse,
  ParliamentMemberSearchResponse,
  ParliamentContactResponse,
  MPDetails,
} from "./types";
import { MPLookupError } from "./types";

const POSTCODES_IO_BASE = "https://api.postcodes.io";
const PARLIAMENT_API_BASE = "https://members-api.parliament.uk/api";
const UPSTREAM_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache (will reset on server restart — fine for MVP)
const cache = new Map<string, { result: MPLookupResult; expiresAt: number }>();

function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, "").toUpperCase();
}

// Basic UK postcode format check (client-side guard before hitting APIs)
const UK_POSTCODE_REGEX =
  /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export function isValidPostcodeFormat(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode.trim());
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateAndLookupPostcode(
  postcode: string
): Promise<{ valid: boolean; constituency: string | null }> {
  const encoded = encodeURIComponent(postcode.trim());
  const response = await fetchWithTimeout(
    `${POSTCODES_IO_BASE}/postcodes/${encoded}`
  );

  if (response.status === 404) {
    return { valid: false, constituency: null };
  }

  if (!response.ok) {
    throw new MPLookupError(
      "Postcode validation service unavailable",
      502,
      "UPSTREAM_ERROR"
    );
  }

  const data: PostcodesIOResponse = await response.json();

  if (typeof data.result === "boolean") {
    return { valid: data.result, constituency: null };
  }

  const constituency =
    data.result.parliamentary_constituency_2024 ??
    data.result.parliamentary_constituency;

  return { valid: true, constituency };
}

async function searchMPByPostcode(
  postcode: string
): Promise<ParliamentMemberSearchResponse> {
  const encoded = encodeURIComponent(postcode.trim());
  const response = await fetchWithTimeout(
    `${PARLIAMENT_API_BASE}/Members/Search?Location=${encoded}&House=1&IsCurrentMember=true`
  );

  if (!response.ok) {
    throw new MPLookupError(
      "Parliament API unavailable",
      502,
      "UPSTREAM_ERROR"
    );
  }

  return response.json();
}

async function getMPContactDetails(
  memberId: number
): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      `${PARLIAMENT_API_BASE}/Members/${memberId}/Contact`
    );

    if (!response.ok) return null;

    const data: ParliamentContactResponse = await response.json();

    // Look for parliamentary email first, then any email
    for (const contact of data.value) {
      if (contact.email) {
        return contact.email;
      }
    }

    return null;
  } catch {
    // Contact details are nice-to-have; don't fail the whole lookup
    return null;
  }
}

export async function lookupMP(postcode: string): Promise<MPLookupResponse> {
  // Step 1: Basic format validation
  if (!isValidPostcodeFormat(postcode)) {
    throw new MPLookupError(
      "That doesn't look like a valid UK postcode. Please check and try again.",
      400,
      "INVALID_POSTCODE"
    );
  }

  const normalized = normalizePostcode(postcode);

  // Step 2: Check cache
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cached: true };
  }

  // Step 3: Validate postcode and get constituency via Postcodes.io
  let constituency: string | null = null;

  try {
    const postcodeResult = await validateAndLookupPostcode(postcode);
    if (!postcodeResult.valid) {
      throw new MPLookupError(
        "That doesn't look like a valid UK postcode. Please check and try again.",
        400,
        "INVALID_POSTCODE"
      );
    }
    constituency = postcodeResult.constituency;
  } catch (error) {
    if (error instanceof MPLookupError && error.code === "INVALID_POSTCODE") {
      throw error;
    }
    // Postcodes.io is down — we'll try Parliament API directly
  }

  // Step 4: Search for MP via Parliament API
  let mpDetails: MPDetails | null = null;

  try {
    const searchResult = await searchMPByPostcode(postcode);

    if (searchResult.items.length === 0) {
      if (constituency) {
        // We have constituency but no MP — dissolved parliament or edge case
        throw new MPLookupError(
          "We couldn't find a current MP for that postcode. This may happen during a parliamentary dissolution.",
          404,
          "MP_NOT_FOUND"
        );
      }
      throw new MPLookupError(
        "We couldn't find an MP for that postcode.",
        404,
        "MP_NOT_FOUND"
      );
    }

    const member = searchResult.items[0].value;
    const email = await getMPContactDetails(member.id);

    mpDetails = {
      name: member.nameDisplayAs,
      party: member.latestParty.name,
      constituency: member.latestHouseMembership.membershipFrom,
      email,
      photoUrl: member.thumbnailUrl || null,
      profileUrl: `https://members.parliament.uk/member/${member.id}/contact`,
    };

    // Use constituency from Parliament API if Postcodes.io didn't provide one
    if (!constituency) {
      constituency = member.latestHouseMembership.membershipFrom;
    }
  } catch (error) {
    if (error instanceof MPLookupError) {
      // If it's MP_NOT_FOUND or INVALID_POSTCODE, rethrow
      if (error.code !== "UPSTREAM_ERROR") throw error;
    }

    // Parliament API is down — return partial result if we have constituency
    if (constituency) {
      return {
        mp: null,
        constituency,
        cached: false,
        partial: true,
        message: `We found your constituency (${constituency}) but MP details are temporarily unavailable. Please try again later.`,
      };
    }

    throw new MPLookupError(
      "We're having trouble reaching the MP lookup service. Please try again in a moment.",
      502,
      "UPSTREAM_ERROR"
    );
  }

  // Step 5: If postcode wasn't validated but we got MP data, validate was skipped (Postcodes.io down)
  // That's fine — Parliament API accepted it, so it's valid enough.

  const result: MPLookupResult = {
    mp: mpDetails,
    constituency: constituency || mpDetails.constituency,
    cached: false,
  };

  // Step 6: Cache the result
  cache.set(normalized, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

// For testing: clear the cache
export function clearCache(): void {
  cache.clear();
}
