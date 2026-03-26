# docs/IMPLEMENTATION_PLAN.md — Pet POV AI

> Implementation sequence for the Antigravity handoff.
> Each phase produces a functional slice of the product. Implement in order.

---

## Phase 1: Upload Session to Cloudinary + Create Session in Supabase

**Goal:** A user can upload a pet camera video and receive a `sessionId` back.

**Files to implement:**
- `apps/api/src/routes/upload.ts`

**Steps:**
1. Receive `multipart/form-data` with a `video` field (≤ 500 MB), `title`, and `owner_id`
2. Stream `req.file.buffer` to Cloudinary using `cloudinary.uploader.upload_stream`
   - `resource_type: "video"`, `folder: "pet-pov/sessions"`
   - Returns `{ secure_url, public_id, duration }`
3. Call `createSession()` from `@pet-pov/db` to write to the `sessions` table
   - `status: "uploaded"`, `modes_run: []`
4. Return `{ sessionId, cloudinaryUrl, publicId }`

**Environment variables needed:**
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Acceptance criteria:**
- `POST /api/upload` with a valid MP4 returns `{ sessionId }` and a Supabase row exists

---

## Phase 2: Extract Frames/Scenes and Save SessionEvents

**Goal:** A processed session has structured `SessionEvent[]` in the database.

**Files to implement:**
- `apps/worker/src/jobs/scene-extraction.ts` — download from Cloudinary, run FFmpeg frame extraction
- `apps/worker/src/jobs/event-generation.ts` — base64 frames → Gemini Vision → store SessionEvents

**Steps:**

### scene-extraction
1. Download session video from Cloudinary to a local temp dir (`os.tmpdir()/pet-pov/<sessionId>/`)
2. `probeVideo(videoPath)` — get duration (already implemented in `@pet-pov/video`)
3. `extractFrames(videoPath, outputDir, 2)` — extract 1 frame every 2 seconds (already implemented)
4. Store frame directory path so `event-generation` can pick it up
   - Option A: return `{ frameDir }` from the job and chain the next job with it
   - Option B: write to a `pipeline_jobs` record

### event-generation
1. Read JPEG files from `frameDir`, sort chronologically
2. Base64-encode each frame and pair with `timestampSeconds`
3. `analyseVideoFrames(frames)` — Gemini Vision returns `SessionEvent[]` (already implemented in `@pet-pov/ai`)
4. Insert into `session_events` table: `{ session_id, events }`
5. `updateSessionStatus(db, sessionId, "events_extracted")`

**Environment variables needed:**
- `FFMPEG_PATH` (optional — defaults to `$PATH`)
- `GEMINI_API_KEY`

**Acceptance criteria:**
- After `POST /api/process`, `session_events` row exists with non-empty `events` JSON array

---

## Phase 3: Generate Recap Narration from Session Events

**Goal:** A processed session has a narration script stored in the `narrations` table.

**Files to implement:**
- `apps/worker/src/jobs/toon-conversion.ts`
- `apps/worker/src/jobs/narration.ts`

**Steps:**

### toon-conversion
1. Fetch `SessionEvent[]` from `session_events` table for the session
2. `encodeEvents(events)` from `@pet-pov/toon` → TOON string
3. Validate round-trip: `decodeEvents(toon)` should equal original events
4. Pass TOON string to narration job (via job return value or next-job data)

### narration
1. `getPersonaById(db, personaId)` — fetch persona (already implemented)
2. `buildNarrationSystemPrompt(persona)` + `buildNarrationUserMessage(toon)` — build prompts (already implemented)
3. `generateChatCompletion(systemPrompt, userMessage)` — OpenAI GPT-4o (already implemented)
4. Insert script into `narrations` table: `{ video_id: sessionId, persona_id, script, voice_url: null }`
5. Return `narrationId` for the voice-synthesis step

**Environment variables needed:**
- `OPENAI_API_KEY`

**Acceptance criteria:**
- `narrations` row exists with non-empty `script` text after pipeline runs

---

## Phase 4: Generate ElevenLabs Voice Output

**Goal:** The narration script has an associated audio file stored in Cloudinary.

**Files to implement:**
- `apps/worker/src/jobs/voice-synthesis.ts`
- `packages/ai/src/clients/tts.ts` ← **must be created**

**Steps:**
1. Fetch narration record and persona from DB (join `narrations` + `personas`)
2. Based on `persona.tts_provider`, dispatch to the appropriate TTS client:
   - `"elevenlabs"` → ElevenLabs API with `persona.voice_id` and `ELEVENLABS_API_KEY`
   - `"openai"` → OpenAI TTS API with `OPENAI_API_KEY`
   - `"google"` → Google Cloud TTS (stretch)
3. Upload returned audio buffer to Cloudinary (`resource_type: "raw"`, folder `"pet-pov/audio"`)
4. Update `narrations.voice_url` with the Cloudinary URL
5. `updateSessionStatus(db, sessionId, "voiced")`

**New function to create:**
```ts
// packages/ai/src/clients/tts.ts
export async function synthesizeVoice(
  text: string,
  voiceId: string,
  provider: TtsProvider
): Promise<Buffer>
```

**Environment variables needed:**
- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY` (if OpenAI TTS used as fallback)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Acceptance criteria:**
- `narrations.voice_url` is a valid Cloudinary URL pointing to an audio file

---

## Phase 5: Implement Ask My Pet (Session + Memory + Persona)

**Goal:** A user can ask questions about a session and receive in-character pet responses.

**Files to implement:**
- `apps/api/src/routes/ask.ts` (uncomment all TODOs)
- `apps/worker/src/jobs/conversation-generation.ts` (uncomment all TODOs)
- `packages/ai/src/prompts/ask-my-pet.ts` ← **must be created**

**Steps:**
1. Validate session exists and has been processed (status >= `"events_extracted"`)
2. Fetch `session_events.events` → `encodeEvents()` → TOON context string
3. `getPersonaById()` → fetch persona
4. `buildAskMyPetSystemPrompt(persona, toon)` → construct system prompt
   - Must be Q&A style (first-person, in-character), NOT monologue narration
   - Must inject TOON events so the pet "remembers" what happened
5. `getConversationTurns(db, sessionId)` → format as chat history for multi-turn context
6. `generateChatCompletion(systemPrompt, userMessage)` → pet response
7. `synthesizeVoice(petResponse, persona.voice_id, persona.tts_provider)` → audio (from Phase 4)
8. `createConversationTurn(db, { session_id, persona_id, user_message, pet_response, audio_url })`
9. Return `{ response, audioUrl, turnId }`

**New function to create:**
```ts
// packages/ai/src/prompts/ask-my-pet.ts
export function buildAskMyPetSystemPrompt(persona: Persona, toon: string): string
```

**Environment variables needed:**
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`

**Acceptance criteria:**
- `POST /api/ask` returns `{ response: string, audioUrl: string, turnId: string }`
- `conversation_turns` row persisted in Supabase

---

## Phase 6: Optional Rendered Shareable Clip

**Goal:** A processed session can produce a downloadable MP4 with voiceover.

**Files to implement:**
- `apps/worker/src/jobs/video-render.ts`

**Steps:**
1. Fetch session record (source `cloudinary_url`) from DB
2. Fetch narration record (`voice_url`) from DB
3. Download source video + audio to local temp dir
4. `mergeAudioWithVideo(videoPath, audioPath, outputPath)` — FFmpeg (already implemented in `@pet-pov/video`)
5. Upload rendered MP4 to Cloudinary (`resource_type: "video"`, folder `"pet-pov/rendered"`)
6. `createGeneratedAsset(db, { session_id, mode: "recap", type: "video", cloudinary_url, cloudinary_public_id })`
7. `updateSessionStatus(db, sessionId, "complete")`
8. Return rendered asset URL

**Optional enhancement:**
- Use Remotion (`packages/video/src/remotion/`) for captions + branding overlay
- Install with: `pnpm add remotion @remotion/core --filter @pet-pov/video`

**Environment variables needed:**
- `FFMPEG_PATH` (optional)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Acceptance criteria:**
- `generated_assets` row exists with a working Cloudinary video URL
- `session.status === "complete"`

---

## Functions That Do Not Yet Exist (Must Be Created)

| Function | File to create | Used by |
|---|---|---|
| `buildAskMyPetSystemPrompt(persona, toon)` | `packages/ai/src/prompts/ask-my-pet.ts` | Phase 5 |
| `synthesizeVoice(text, voiceId, provider)` | `packages/ai/src/clients/tts.ts` | Phase 4 + 5 |

Both must be exported from `packages/ai/src/index.ts`.

---

## Queue Integration (required for all worker phases)

Before any worker job can run in production, the BullMQ queue must be wired in `apps/api/src/routes/process.ts`:

```ts
const pipelineQueue = new Queue("pipeline", {
  connection: { url: process.env["REDIS_URL"] },
});
```

The first job to enqueue is `"scene-extraction"` with `{ sessionId, personaId }`.  
Subsequent jobs are chained by the worker or triggered by job completion events.

**Environment variables needed:**
- `REDIS_URL`
