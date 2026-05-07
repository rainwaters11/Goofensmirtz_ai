# Persona System Spec

## Overview

This spec defines the persona system for Pet POV AI: how personas are stored, selected, and applied to narration.

---

## Data Model

### Persona Record (Supabase `personas` table)

| Field         | Type       | Description                                      |
|---------------|------------|--------------------------------------------------|
| `id`          | uuid       | Primary key                                      |
| `name`        | text       | Human-readable name (e.g., "Dramatic Dog")       |
| `tone`        | text       | Overall tone descriptor (used in system prompt)  |
| `style`       | text       | Narration style descriptor                       |
| `rules`       | text[]     | Array of behavioural rules for the LLM           |
| `voice_id`    | text       | Provider-specific voice identifier               |
| `tts_provider`| text       | One of: `elevenlabs`, `openai`, `google`         |
| `created_at`  | timestamptz|                                                  |
| `updated_at`  | timestamptz|                                                  |

---

## Seeded Personas

### Dramatic Dog
- **Tone**: theatrical and over-the-top dramatic
- **Style**: cinematic internal monologue with breathless urgency
- **Voice**: ElevenLabs "Adam"
- **Key Rules**: treat every small event as epic; reference smells; never admit fear

### Chill Cat
- **Tone**: dry, detached, and mildly superior
- **Style**: philosophical internal monologue with deadpan observations
- **Voice**: ElevenLabs "Rachel"
- **Key Rules**: everything is beneath you; use ellipses for pauses; regard humans as confused

---

## Behaviour Requirements

### Persona Selection
- [ ] A valid persona must be selected before any narration job begins
- [ ] If the requested persona is not found in the database, the job must fail with a clear error — do NOT fall back to a default
- [ ] Personas are read-only during narration (changes require re-running the narration job)

### Prompt Construction
- [ ] `buildNarrationSystemPrompt(persona)` must include ALL rules from `persona.rules`
- [ ] No personality should be hardcoded anywhere outside the persona record
- [ ] Personas must be stored in the database; local templates exist only for seeding

### Extensibility
- [ ] Adding a new persona requires only a new database record + optional template file in `packages/personas/src/templates/`
- [ ] The narration pipeline must require no code changes to support a new persona

---

## Seeding

### How to Seed Personas
Personas can be seeded via:
1. Direct Supabase Studio insert
2. Running a seed script (TODO: add `scripts/seed-personas.ts`)
3. Via the `DRAMATIC_DOG_PERSONA` and `CHILL_CAT_PERSONA` template objects in `packages/personas`

---

## Open Issues / TODOs

- [ ] Add a `scripts/seed-personas.ts` script that inserts default personas into a fresh database
- [ ] Add a Personas management UI in `apps/web` so creators can view and select personas
- [ ] Consider adding `language` and `accent` fields to the persona model for international support
- [ ] Evaluate storing `rules` as JSONB instead of `text[]` for richer structure
