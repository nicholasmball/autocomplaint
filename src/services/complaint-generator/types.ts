export type ComplaintCategory =
  | "billing"
  | "poor-service"
  | "faulty-product"
  | "delivery"
  | "contract-dispute"
  | "data-privacy"
  | "unfair-treatment"
  | "accessibility";

export type ComplaintTone = "formal" | "firm" | "escalatory" | "conciliatory";

export type RecipientType = "company" | "mp" | "regulator";

export interface ComplaintInput {
  category: ComplaintCategory;
  tone: ComplaintTone;
  recipientType: RecipientType;
  recipientName: string;
  description: string;
  desiredOutcome: string;
  userName: string;
  userAddress?: string;
  previousContact?: string;
  referenceNumbers?: string;
  dateOfIncident?: string;
}

export interface ComplaintOutput {
  letter: string;
  subject: string;
  category: ComplaintCategory;
  tone: ComplaintTone;
  model: string;
  tokenUsage: {
    input: number;
    output: number;
    estimatedCost: number;
  };
}
