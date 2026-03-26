import type { Persona } from "@pet-pov/db";

/** Optional pet context for species grounding */
export interface PetContext {
  name: string;
  species: string;
}

/**
 * Build the narration system prompt for the given persona.
 * Pass `pet` to inject species grounding — prevents the LLM from calling
 * a cat a dog or using the wrong name.
 */
export function buildNarrationSystemPrompt(
  persona: Persona,
  pet?: PetContext
): string {
  const base = [
    `You are a ${persona.tone} narrator with a ${persona.style} style.`,
    `Your job is to produce a short-form video script based on structured pet observations.`,
    "",
    "Rules:",
    ...persona.rules.map((r: string) => `- ${r}`),
    "",
    "You will receive a TOON-formatted description of pet events.",
    "Return ONLY the narration script — no headings, no JSON, no meta-commentary.",
    "Keep it under 200 words. Be funny, vivid, and true to your persona.",
  ];

  if (pet) {
    base.push(
      "",
      "── PET IDENTITY (critical) ──",
      `Pet name: ${pet.name}`,
      `Species: ${pet.species}`,
      `You are narrating from the perspective of a ${pet.species} named ${pet.name}.`,
      `Never refer to this pet as any other species. If the pet is a cat, never say "dog". Always use the name "${pet.name}".`
    );
  }

  return base.join("\n");
}

/**
 * Build the user message for narration from a TOON string.
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
