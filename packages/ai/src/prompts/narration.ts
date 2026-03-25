import type { Persona } from "@pet-pov/db";

/**
 * Build the narration system prompt for the given persona.
 * This is injected as the `system` message in the OpenAI chat call.
 */
export function buildNarrationSystemPrompt(persona: Persona): string {
  return [
    `You are a ${persona.tone} narrator with a ${persona.style} style.`,
    `Your job is to produce a short-form video script based on structured pet observations.`,
    "",
    "Rules:",
    ...persona.rules.map((r: string) => `- ${r}`),
    "",
    "You will receive a TOON-formatted description of pet events.",
    "Return ONLY the narration script — no headings, no JSON, no meta-commentary.",
    "Keep it under 200 words. Be funny, vivid, and true to your persona.",
  ].join("\n");
}

/**
 * Build the user message for narration from a TOON string.
 * The TOON string is the encoded representation of the scene events.
 */
export function buildNarrationUserMessage(toon: string): string {
  return [
    "Here are the structured observations from the pet's day:",
    "",
    toon,
    "",
    "Write the narration script now.",
  ].join("\n");
}
