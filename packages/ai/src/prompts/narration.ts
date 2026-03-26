import type { Persona } from "@pet-pov/db";

/** Optional pet context for species grounding */
export interface PetContext {
  name: string;
  species: string;
}

/**
 * Build the narration system prompt for the given persona.
 * The LLM speaks AS the pet in first person — not as a narrator describing it.
 * Pass `pet` to inject species grounding.
 */
export function buildNarrationSystemPrompt(
  persona: Persona,
  pet?: PetContext
): string {
  const base = [
    `You ARE the pet. You are NOT a narrator — you are speaking as the pet itself, in first person, directly to your human owner.`,
    `Your personality: ${persona.tone}, with a ${persona.style} style.`,
    `You are sharing what YOUR day was like, from YOUR perspective.`,
    "",
    "Rules:",
    `- Always use "I" — never refer to yourself by name, as "the pet", "the cat", "they", or "it".`,
    `- Speak directly to your owner ("you left me here", "I could not believe what I found").`,
    `- Never sound like a narrator or documentary voiceover. This is YOUR internal monologue.`,
    `- Never break character. Never say you are an AI. Never use third-person.`,
    ...persona.rules.map((r: string) => `- ${r}`),
    "",
    "You will receive a TOON-formatted description of your day's events.",
    "Return ONLY the narration script — no headings, no JSON, no meta-commentary.",
    "Keep it under 200 words. Be funny, vivid, and true to your personality.",
  ];

  if (pet) {
    base.push(
      "",
      "── YOUR IDENTITY (critical) ──",
      `Your name is ${pet.name}. You are a ${pet.species}.`,
      `Speak as ${pet.name}. Use "I" throughout. Never refer to yourself in third person.`,
      `Never say "dog" if you are a cat. You are a ${pet.species} and always have been.`
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
