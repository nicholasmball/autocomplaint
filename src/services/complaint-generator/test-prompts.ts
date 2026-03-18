/**
 * Manual test script for complaint generation prompts.
 * Run with: npx tsx src/services/complaint-generator/test-prompts.ts
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 */
import { generateComplaint } from "./index";
import type { ComplaintInput } from "./types";

const TEST_CASES: { name: string; input: ComplaintInput }[] = [
  {
    name: "Billing complaint (formal tone)",
    input: {
      category: "billing",
      tone: "formal",
      recipientType: "company",
      recipientName: "British Gas",
      description:
        "I have been overcharged £247 on my March 2026 gas bill. My actual meter reading shows 4521 but the bill is based on an estimated reading of 5890. I submitted my meter reading online on 28 February but it was ignored.",
      desiredOutcome:
        "I want a corrected bill based on my actual meter reading, a refund of the overcharged amount, and confirmation that future bills will use actual readings.",
      userName: "Jane Smith",
      userAddress: "42 Oak Lane, Manchester, M15 6JH",
      referenceNumbers: "Account: BG-9912834",
      dateOfIncident: "1 March 2026",
    },
  },
  {
    name: "Faulty product (firm tone)",
    input: {
      category: "faulty-product",
      tone: "firm",
      recipientType: "company",
      recipientName: "Currys",
      description:
        "I purchased a Samsung washing machine on 15 January 2026 for £599. After just 6 weeks of normal use, the drum has developed a loud grinding noise and the spin cycle no longer works. I reported this to your customer service on 1 March but was told my warranty claim would take 6-8 weeks to process.",
      desiredOutcome:
        "I want an immediate replacement or full refund under my Consumer Rights Act 2015 right to repair or replacement within 6 months of purchase.",
      userName: "David Chen",
      dateOfIncident: "1 March 2026",
      referenceNumbers: "Order: CUR-20260115-7843",
    },
  },
  {
    name: "Poor service to MP (escalatory tone)",
    input: {
      category: "poor-service",
      tone: "escalatory",
      recipientType: "mp",
      recipientName: "Sarah Jones MP",
      description:
        "I have been waiting 14 months for a SEND assessment for my 7-year-old son from the local education authority. Despite multiple requests, the council has failed to meet the statutory 20-week deadline. My son is falling further behind in school without the support he needs. I have complained to the council three times with no meaningful response.",
      desiredOutcome:
        "I am asking you as my MP to intervene with the local education authority and raise this systemic failure with the Department for Education.",
      userName: "Maria Rodriguez",
      userAddress: "8 Birch Road, Bristol, BS3 4QR",
      previousContact:
        "Council complaints: 12 Jan, 15 Apr, 22 Sep 2025 — no resolution",
    },
  },
  {
    name: "Data privacy (conciliatory tone)",
    input: {
      category: "data-privacy",
      tone: "conciliatory",
      recipientType: "company",
      recipientName: "Tesco Clubcard",
      description:
        "I submitted a Subject Access Request on 1 January 2026 and have not received any response after 2 months. Under UK GDPR you have 30 days to respond. I understand these things can be complex but I do need my data.",
      desiredOutcome:
        "Please provide my complete data as requested in my SAR within 14 days, or provide a clear timeline for when it will be available.",
      userName: "Tom Wilson",
      referenceNumbers: "SAR-2026-0101-TW",
    },
  },
];

async function runTests() {
  console.log("=== Complaint Generation Prompt Test Suite ===\n");

  for (const testCase of TEST_CASES) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log("=".repeat(60));

    try {
      const start = Date.now();
      const result = await generateComplaint(testCase.input);
      const elapsed = Date.now() - start;

      console.log(`\nSubject: ${result.subject}`);
      console.log(`Time: ${elapsed}ms`);
      console.log(
        `Tokens: ${result.tokenUsage.input} in / ${result.tokenUsage.output} out`
      );
      console.log(`Est. cost: $${result.tokenUsage.estimatedCost.toFixed(6)}`);
      console.log(`\n--- Letter ---\n`);
      console.log(result.letter);
      console.log(`\n--- End ---\n`);
    } catch (error) {
      console.error(`FAILED: ${error}`);
    }
  }
}

runTests().catch(console.error);
