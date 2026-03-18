export interface MPDetails {
  name: string;
  party: string;
  constituency: string;
  email: string | null;
  photoUrl: string | null;
  profileUrl: string;
}

export interface MPLookupResult {
  mp: MPDetails;
  constituency: string;
  cached: boolean;
}

export interface MPLookupPartialResult {
  mp: null;
  constituency: string;
  cached: boolean;
  partial: true;
  message: string;
}

export type MPLookupResponse = MPLookupResult | MPLookupPartialResult;

export interface PostcodesIOResponse {
  status: number;
  result: {
    postcode: string;
    parliamentary_constituency_2024: string | null;
    parliamentary_constituency: string | null;
    country: string;
    region: string | null;
  } | boolean;
}

export interface ParliamentMemberSearchResponse {
  items: Array<{
    value: {
      id: number;
      nameDisplayAs: string;
      nameFullTitle: string;
      gender: string;
      latestParty: {
        name: string;
        abbreviation: string;
        backgroundColour: string;
        foregroundColour: string;
      };
      latestHouseMembership: {
        membershipFrom: string;
        house: number;
        membershipStartDate: string;
      };
      thumbnailUrl: string;
    };
    links: Array<{
      rel: string;
      href: string;
      method: string;
    }>;
  }>;
  totalResults: number;
}

export interface ParliamentContactResponse {
  value: Array<{
    type: string;
    typeDescription: string;
    typeId: number;
    isPreferred: boolean;
    isWebAddress: boolean;
    notes: string | null;
    line1: string;
    line2: string | null;
    line3: string | null;
    line4: string | null;
    line5: string | null;
    postcode: string | null;
    phone: string | null;
    fax: string | null;
    email: string | null;
  }>;
}

export class MPLookupError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: "INVALID_POSTCODE" | "MP_NOT_FOUND" | "UPSTREAM_ERROR"
  ) {
    super(message);
    this.name = "MPLookupError";
  }
}
