import { Router } from "express";
import {
  DRAMATIC_DOG_PERSONA,
  CHILL_CAT_PERSONA,
  NEIGHBORHOOD_BOSS_PERSONA,
  CHAOTIC_GREMLIN_PERSONA,
  ROYAL_HOUSE_CAT_PERSONA,
} from "@pet-pov/personas";

const router = Router();

/**
 * Persona catalogue — the five built-in persona presets exposed as a REST list.
 *
 * Each entry extends the shared PersonaInsert template with:
 *   - id:          stable slug used by the frontend PersonaSelector
 *   - emoji:       visual identifier for the UI card
 *   - description: one-sentence human-readable summary
 *
 * TODO: When Supabase is wired, merge this list with rows from the `personas`
 *       table so that user-created personas also appear here.
 */
const PERSONA_CATALOGUE = [
  {
    id: "dramatic-dog",
    name: DRAMATIC_DOG_PERSONA.name,
    tone: DRAMATIC_DOG_PERSONA.tone,
    style: DRAMATIC_DOG_PERSONA.style,
    emoji: "🐕",
    description: "Theatrical, breathless, treats everything as epic.",
  },
  {
    id: "chill-cat",
    name: CHILL_CAT_PERSONA.name,
    tone: CHILL_CAT_PERSONA.tone,
    style: CHILL_CAT_PERSONA.style,
    emoji: "🐈",
    description: "Dry, detached, philosophically superior.",
  },
  {
    id: "neighborhood-boss",
    name: NEIGHBORHOOD_BOSS_PERSONA.name,
    tone: NEIGHBORHOOD_BOSS_PERSONA.tone,
    style: NEIGHBORHOOD_BOSS_PERSONA.style,
    emoji: "🐾",
    description: "Confident, territorial, matter-of-fact patrol commander.",
  },
  {
    id: "chaotic-gremlin",
    name: CHAOTIC_GREMLIN_PERSONA.name,
    tone: CHAOTIC_GREMLIN_PERSONA.tone,
    style: CHAOTIC_GREMLIN_PERSONA.style,
    emoji: "😈",
    description: "Hyperactive, unhinged, maximum enthusiasm at all times.",
  },
  {
    id: "royal-house-cat",
    name: ROYAL_HOUSE_CAT_PERSONA.name,
    tone: ROYAL_HOUSE_CAT_PERSONA.tone,
    style: ROYAL_HOUSE_CAT_PERSONA.style,
    emoji: "👑",
    description: "Regal, condescending, effortlessly superior.",
  },
];

/**
 * GET /api/personas
 *
 * Returns the full list of available narration personas.
 * Used by the PersonaSelector component in the upload flow and settings page.
 *
 * Response shape:
 * {
 *   personas: Array<{
 *     id: string;
 *     name: string;
 *     tone: string;
 *     style: string;
 *     emoji: string;
 *     description: string;
 *   }>
 * }
 */
router.get("/", (_req, res) => {
  res.json({ personas: PERSONA_CATALOGUE });
});

export { router as personasRouter };
