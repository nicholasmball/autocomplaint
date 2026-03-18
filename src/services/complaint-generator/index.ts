import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import type { ComplaintInput, ComplaintOutput } from "./types";

// Haiku for cost-effective generation; upgrade to Sonnet for premium tier
export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Rough pricing per 1M tokens (Haiku 4.5)
const INPUT_COST_PER_M = 0.8;
const OUTPUT_COST_PER_M = 4.0;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function callWithRetry(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<Anthropic.Message> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except rate limits (429)
      if (
        error instanceof Anthropic.APIError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 429
      ) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function generateComplaint(
  input: ComplaintInput
): Promise<ComplaintOutput> {
  const client = new Anthropic();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const response = await callWithRetry(client, systemPrompt, userPrompt);

  const letter =
    response.content[0].type === "text" ? response.content[0].text : "";

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const estimatedCost =
    (inputTokens / 1_000_000) * INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;

  // Extract a subject line from the letter (look for "Subject:" or "Re:" line)
  const subjectMatch = letter.match(/^(?:Subject|Re):\s*(.+)$/m);
  const subject =
    subjectMatch?.[1] ??
    `Formal Complaint - ${input.category.replace("-", " ")}`;

  return {
    letter,
    subject,
    category: input.category,
    tone: input.tone,
    model: DEFAULT_MODEL,
    tokenUsage: {
      input: inputTokens,
      output: outputTokens,
      estimatedCost: Math.round(estimatedCost * 1_000_000) / 1_000_000,
    },
  };
}

export { buildSystemPrompt, buildUserPrompt } from "./prompts";
export type { ComplaintInput, ComplaintOutput, ComplaintCategory, ComplaintTone, RecipientType } from "./types";
