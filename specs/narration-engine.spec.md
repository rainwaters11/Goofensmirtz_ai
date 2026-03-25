# Narration Engine Spec

## Overview

This spec defines the expected behaviour of the narration generation step in the Pet POV AI pipeline.

---

## Pipeline Stage: TOON Encoding

### Goal
Convert structured `SceneEvent[]` JSON into a compact TOON string suitable for sending to an LLM with minimal token cost.

### Inputs
- `events: SceneEvent[]` — ordered list of extracted scene events from the Gemini vision step

### Outputs
- `toon: string` — multi-line TOON-encoded representation of the events

### Acceptance Criteria
- [ ] Output is a non-empty string for any non-empty event list
- [ ] Round-trip (`encodeEvents → decodeEvents`) produces semantically equivalent events
- [ ] Encoding is deterministic: same input always produces the same output
- [ ] Empty input list returns an empty string without throwing

---

## Pipeline Stage: Persona-Based Narration

### Goal
Use a stored persona and a TOON-encoded scene description to generate a funny, personality-driven narration script via OpenAI GPT-4o.

### Inputs
- `personaId: string` — UUID referencing a record in the `personas` table
- `toon: string` — TOON-encoded scene string from the previous step

### Outputs
- `script: string` — narration script ready for TTS synthesis

### Acceptance Criteria
- [ ] A valid persona is always fetched from the database before calling OpenAI
- [ ] The system prompt is built entirely from persona fields (tone, style, rules) — no hardcoded personality
- [ ] The user message always contains the TOON string verbatim
- [ ] Script length is ≤ 200 words
- [ ] Missing or invalid `personaId` throws before any OpenAI call is made

---

## Pipeline Stage: TTS Voice Synthesis

### Goal
Convert the narration script into an audio file using the persona's configured TTS provider and voice ID.

### Inputs
- `script: string`
- `voiceId: string` — provider-specific voice identifier
- `ttsProvider: "elevenlabs" | "openai" | "google"`

### Outputs
- `audioBuffer: Buffer` — raw MP3 audio
- `cloudinaryUrl: string` — URL of uploaded audio file

### Acceptance Criteria
- [ ] Correct TTS provider is selected based on `persona.tts_provider`
- [ ] Audio is uploaded to Cloudinary and a URL is returned
- [ ] Narration record is updated with `voice_url` after successful upload
- [ ] Function fails with a clear error if `TTS_API_KEY` is not set

---

## Open Issues / TODOs

- [ ] Add maximum script-length enforcement before sending to TTS (to avoid runaway billing)
- [ ] Implement ElevenLabs client (only OpenAI TTS stub exists today)
- [ ] Add narration review UI so creators can approve/regenerate before voicing
