# HANDOFF.md — Pet POV AI Implementation Handoff

> **Recipient:** Antigravity  
> **Status:** Architecture and scaffolding complete. All implementation is TODO-stubbed and ready for an implementation agent to fill in.

---

## 1. Current Product Summary

Pet POV AI is an **AI-powered pet perspective platform** with two MVP modes:

| Mode | Description |
|---|---|
| **Experience Recap** | User uploads wearable pet camera footage → AI extracts events → narrated short-form video from the pet's POV |
| **Ask My Pet** | User selects a processed session → asks questions → AI generates simulated pet responses (text + voice) |

> **Critical constraint:** This is creative character simulation — NOT animal translation. No UI copy may claim otherwise.

---

## 2. Canonical MVP Flow

### Experience Recap Pipeline (Steps 1–10)

```
1. POST /api/upload
       ↓ multipart video → Cloudinary upload_stream
       ↓ createSession() in Supabase → status: "uploaded"

2. POST /api/process  { sessionId, personaId }
       ↓ enqueues BullMQ job: "scene-extraction"

3. Worker: scene-extraction
       ↓ probeVideo() → extractFrames() via @pet-pov/video
       ↓ saves frame paths + metadata for next step

4. Worker: event-generation
       ↓ analyseVideoFrames() via @pet-pov/ai (Gemini Vision)
       ↓ stores SessionEvent[] → session_events table
       ↓ updateSessionStatus("events_extracted")

5. Worker: toon-conversion
       ↓ encodeEvents(SessionEvent[]) via @pet-pov/toon
       ↓ passes TOON string in-memory to narration step
       ↓ updateSessionStatus("toon_converted")

6. Worker: narration  { sessionId, personaId, toon }
       ↓ getPersonaById() → buildNarrationSystemPrompt()
       ↓ generateChatCompletion() via OpenAI GPT-4o
       ↓ stores script → narrations table
       ↓ updateSessionStatus("narrated")

7. Worker: voice-synthesis  { sessionId, narrationId }
       ↓ fetch narration + persona from DB
       ↓ call ElevenLabs / OpenAI TTS with persona.voice_id
       ↓ upload audio → Cloudinary
       ↓ update narrations.voice_url
       ↓ updateSessionStatus("voiced")

8. Worker: video-render  { sessionId, narrationId }
       ↓ download original video + voice audio from Cloudinary
       ↓ mergeAudioWithVideo() via @pet-pov/video (FFmpeg)
       ↓ upload rendered MP4 → Cloudinary
       ↓ createGeneratedAsset({ mode: "recap", type: "video" })
       ↓ updateSessionStatus("complete")
```

### Ask My Pet Pipeline

```
1. POST /api/ask  { sessionId, personaId, message }
       ↓ getSessionById() → verify status includes events_extracted
       ↓ fetch session_events → encodeEvents() → TOON string
       ↓ getPersonaById() → buildAskMyPetSystemPrompt(persona, toon)
       ↓ getConversationTurns() → format history
       ↓ generateChatCompletion() via OpenAI GPT-4o
       ↓ synthesizeVoice() → ElevenLabs TTS
       ↓ createConversationTurn() → conversation_turns table
       ↓ returns { response, audioUrl, turnId }
```

---

## 3. Implemented vs Scaffolded

### ✅ Fully Implemented (no TODOs)

| Layer | What's done |
|---|---|
| `packages/toon` | JSON↔TOON encoder/decoder — complete, tested |
| `packages/video` | `probeVideo()`, `extractFrames()`, `groupFramesIntoScenes()`, `mergeAudioWithVideo()` — complete |
| `packages/ai` | OpenAI + Gemini client wrappers, narration prompt builders — complete |
| `packages/personas` | Dramatic Dog + Chill Cat templates — complete |
| `packages/db` | All typed queries (sessions, pets, personas, jobs, conversation_turns, generated_assets) — complete |
| `infra/supabase/migrations` | `001_initial.sql` (videos, personas, narrations, pipeline_jobs) and `002_sessions.sql` (pets, sessions, session_events, conversation_turns, generated_assets) — complete |
| `apps/api/src/index.ts` | All routes mounted (`/upload`, `/process`, `/narrate`, `/voice`, `/render`, `/ask`) — complete |
| `apps/web` | Full UI scaffold (upload, sessions, personas, dashboard, Ask My Pet panel) — complete |
| `specs/` | 27 Vitest tests for pipeline and TOON — all passing |

### 🔧 Scaffolded / TODO (implementation needed)

| File | What's missing |
|---|---|
| `apps/api/src/routes/upload.ts` | Cloudinary `upload_stream`, `createSession()` DB call |
| `apps/api/src/routes/process.ts` | BullMQ queue connection + `pipelineQueue.add()` |
| `apps/api/src/routes/narrate.ts` | Fetch events → TOON → persona → `generateChatCompletion()` → store |
| `apps/api/src/routes/ask.ts` | Full Ask My Pet flow — all steps commented out |
| `apps/worker/src/jobs/scene-extraction.ts` | Cloudinary download + frame storage handoff |
| `apps/worker/src/jobs/event-generation.ts` | Load frames → base64 → `analyseVideoFrames()` → store |
| `apps/worker/src/jobs/toon-conversion.ts` | Fetch events → `encodeEvents()` → pass to narration |
| `apps/worker/src/jobs/narration.ts` | Store script in `narrations` table |
| `apps/worker/src/jobs/voice-synthesis.ts` | TTS provider dispatch + Cloudinary audio upload |
| `apps/worker/src/jobs/video-render.ts` | Download assets + `mergeAudioWithVideo()` + upload result |
| `apps/worker/src/jobs/conversation-generation.ts` | Full Ask My Pet job — all steps commented out |

---

## 4. Canonical Domain Language

| Term | Status | Table | Notes |
|---|---|---|---|
| `Session` | **Canonical** | `sessions` | Primary entity for all new code |
| `SessionEvent` | **Canonical** | `session_events` (JSONB) | Replaces `SceneEvent` |
| `Pet` | **Canonical** | `pets` | Links to default `Persona` |
| `Persona` | **Canonical** | `personas` | Narration style + voice mapping |
| `ConversationTurn` | **Canonical** | `conversation_turns` | Ask My Pet Q&A history |
| `GeneratedAsset` | **Canonical** | `generated_assets` | Rendered output (video/audio/script) |
| `Video` | **Legacy** | `videos` | Kept for backwards compat — `@deprecated` |
| `SceneEvent` | **Legacy** | (type alias) | `= SessionEvent` — `@deprecated` |

> All new worker jobs and API routes should use `sessionId` and `Session`. The `videoId` / `Video` fields are accepted for backwards compatibility only.

---

## 5. Recommended Next Build Order

Implement in this sequence — each step unblocks the next:

### Phase 1 — Upload (unblocks everything)
**File:** `apps/api/src/routes/upload.ts`  
Stream `req.file.buffer` → Cloudinary → call `createSession()` in Supabase → return `{ sessionId, cloudinaryUrl }`.

### Phase 2 — Scene Extraction + Event Generation (unblocks narration)
**Files:**
- `apps/worker/src/jobs/scene-extraction.ts` — download from Cloudinary, run `extractFrames()`, store frame paths
- `apps/worker/src/jobs/event-generation.ts` — load frames, base64 encode, call `analyseVideoFrames()` (Gemini), store to `session_events`

### Phase 3 — TOON Conversion + Narration
**Files:**
- `apps/worker/src/jobs/toon-conversion.ts` — `encodeEvents()`, validate round-trip, pass to narration
- `apps/worker/src/jobs/narration.ts` — `generateChatCompletion()`, store script in `narrations`

### Phase 4 — Voice Synthesis
**File:** `apps/worker/src/jobs/voice-synthesis.ts`  
Dispatch to ElevenLabs (primary) or OpenAI TTS. Upload audio to Cloudinary. Update `narrations.voice_url`.

### Phase 5 — Ask My Pet
**Files:**
- `apps/api/src/routes/ask.ts` — full conversational flow
- `apps/worker/src/jobs/conversation-generation.ts` — same flow as async job

### Phase 6 — Video Render (optional for MVP)
**File:** `apps/worker/src/jobs/video-render.ts`  
`mergeAudioWithVideo()` with FFmpeg. Upload MP4 to Cloudinary. Create `GeneratedAsset` record.

### Phase 7 — BullMQ Queue Integration
**File:** `apps/api/src/routes/process.ts`  
Connect to Redis, `pipelineQueue.add("scene-extraction", { sessionId })`. Return `{ jobId }`.

---

## 6. Key Package APIs

### `@pet-pov/video`
```ts
probeVideo(filePath: string): Promise<{ durationSeconds: number }>
extractFrames(videoPath: string, outputDir: string, intervalSeconds: number): Promise<ExtractedFrame[]>
mergeAudioWithVideo(videoPath: string, audioPath: string, outputPath: string): Promise<void>
```

### `@pet-pov/ai`
```ts
// Gemini Vision
analyseVideoFrames(frames: { imageBase64: string; timestampSeconds: number }[]): Promise<SessionEvent[]>

// OpenAI GPT-4o
generateChatCompletion(systemPrompt: string, userMessage: string): Promise<string>

// Prompt builders
buildNarrationSystemPrompt(persona: Persona): string
buildNarrationUserMessage(toon: string): string
```

### `@pet-pov/toon`
```ts
encodeEvents(events: SessionEvent[]): string   // JSON → TOON
decodeEvents(toon: string): SessionEvent[]     // TOON → JSON
```

### `@pet-pov/db`
```ts
createSession(db, data: SessionInsert): Promise<Session>
getSessionById(db, id: string): Promise<Session | null>
updateSessionStatus(db, id: string, status: SessionStatus): Promise<void>
getPersonaById(db, id: string): Promise<Persona | null>
createConversationTurn(db, data: ConversationTurnInsert): Promise<ConversationTurn>
getConversationTurns(db, sessionId: string): Promise<ConversationTurn[]>
createGeneratedAsset(db, data: GeneratedAssetInsert): Promise<GeneratedAsset>
```

---

## 7. Notes for the Implementation Agent

- **Do not add new dependencies** without checking `AGENTS.md` constraints first.
- All Supabase calls use the **service client** (`getSupabaseServiceClient()`) — not the anon client.
- Cloudinary is configured via `CLOUDINARY_URL` or the three separate env vars (`CLOUD_NAME`, `API_KEY`, `API_SECRET`).
- ElevenLabs API key is `ELEVENLABS_API_KEY`. Do not use the generic `TTS_API_KEY` for new code — use the named key.
- FFmpeg binary path should be read from `FFMPEG_PATH` if set, otherwise assume it's on `$PATH`.
- TOON is **never stored in the database for production** — it is generated in-memory per request/job.
- The `buildAskMyPetSystemPrompt()` function does not exist yet — it needs to be created in `packages/ai/src/prompts/` (separate from `buildNarrationSystemPrompt` which is monologue-style, not Q&A).
- Worker jobs should use `await job.updateProgress(N)` at logical checkpoints for real-time UI feedback.
