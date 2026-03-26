# AGENTS.md

## Project: Pet POV AI

Pet POV AI is an **AI-powered pet perspective platform** that transforms recorded pet camera footage into character-driven creative experiences.

The platform operates in two MVP modes:

### Mode 1: Experience Recap
User uploads wearable pet camera footage → system extracts events → generates narrated short-form video from the pet's point of view.

### Mode 2: Ask My Pet
User selects a processed session → asks questions → system generates a simulated pet response (text + voice) using session events, persona memory, and conversation history.

> See [PRODUCT.md](./PRODUCT.md) for full product vision, user flows, and non-goals.

---

## ⛔ MVP Boundaries (All Agents Must Respect)

- **No live streaming** — recorded session upload only
- **No real-time inference** — all processing is async via the worker queue
- **No claim of animal translation** — this is character simulation, not science
- **No multi-pet sessions for MVP** — one pet per session
- **No social feed** — creator exports their own content

These boundaries are permanent constraints for MVP scope. Do NOT build features that cross them.

---

## 🧠 Core System Flows

### Experience Recap Pipeline

All agents must follow this pipeline for recap mode:

1. Upload session video
2. Store media (Cloudinary)
3. Extract scenes (FFmpeg / PySceneDetect)
4. Generate structured `SessionEvent[]` (Gemini Vision)
5. Store events as JSON
6. Convert JSON → TOON
7. Generate narration script (OpenAI + Persona)
8. Generate TTS voiceover
9. Render final video (FFmpeg / Remotion)
10. Save `GeneratedAsset` and return output URL

DO NOT skip steps or merge responsibilities across layers.

### Ask My Pet Pipeline

1. Receive user question + `sessionId` + `personaId`
2. Fetch `SessionEvent[]` for the session
3. Encode events to TOON (context window)
4. Fetch conversation history (`ConversationTurn[]`)
5. Build system prompt using persona rules
6. Generate response (OpenAI GPT-4o)
7. Synthesize TTS response audio
8. Store `ConversationTurn` and return response + audio URL

---

## 🧩 Architecture Rules

- Use TypeScript across the entire project
- Keep logic modular and reusable
- Separate concerns strictly:
  - `apps/web` → UI only
  - `apps/api` → request handling
  - `apps/worker` → background jobs
  - `packages/*` → shared logic

- Do not place business logic in frontend components
- Do not duplicate logic across apps
- Always prefer shared packages

---

## 🧱 Key Packages

- `packages/ai` → model clients and prompt logic
- `packages/toon` → JSON ↔ TOON conversion
- `packages/video` → FFmpeg + scene processing
- `packages/personas` → persona templates and rules
- `packages/db` → Supabase queries and types

---

## 🗄️ Domain Model Reference

| Type | Table | Description |
|---|---|---|
| `Pet` | `pets` | Pet profile (name, species, photo) |
| `Persona` | `personas` | Narration personality and voice mapping |
| `Session` | `sessions` | A recorded pet camera session |
| `SessionEvent` | (JSONB in `sessions`) | AI-extracted event from a session |
| `ConversationTurn` | `conversation_turns` | A Q&A turn in Ask My Pet mode |
| `GeneratedAsset` | `generated_assets` | A rendered video, audio clip, or script |

The legacy `Video` / `SceneEvent` types in `packages/db/src/types.ts` remain for backwards compatibility. Prefer `Session` / `SessionEvent` in all new code.

---

## 🤖 AI Usage Rules

- NEVER combine perception and narration in one step
- Vision models ONLY generate structured event data
- Narration models ONLY generate scripts or conversational responses

Always follow:

```
Vision → JSON → TOON → Narration / Response
```

---

## 🧾 TOON Rules

- Use TOON only when sending structured data to LLMs
- Keep JSON internally for debugging and storage
- TOON must be deterministic and reversible
- Do not store TOON in database

---

## 🎭 Persona System Rules

- Every narration and Ask My Pet response must use a persona
- Personas must be reusable and stored in DB
- Personas define:
  - tone
  - style
  - rules
  - voice mapping

Do not hardcode personality in prompts

---

## 🔁 Worker Rules

- All heavy tasks must run in `apps/worker`
- Never block API routes with long-running jobs
- Each step in the pipeline should be independently callable
- Jobs must be retry-safe

---

## 📦 API Design Rules

All endpoints must be thin and delegate logic:

- `/api/upload` → upload session media only
- `/api/process` → trigger Experience Recap pipeline
- `/api/narrate` → narration only
- `/api/voice` → voice synthesis only
- `/api/render` → final video render
- `/api/ask` → Ask My Pet conversational endpoint

Do not mix responsibilities

---

## 🔐 Environment Rules

All secrets must be stored in environment variables:

Required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CLOUDINARY_URL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `TTS_API_KEY`

Never hardcode secrets

---

## 🧪 Development Rules

- Use TODO comments for incomplete logic
- Do not fake implementations
- Prefer real structure over placeholder complexity
- Keep functions small and composable

---

## ⚡ Coding Style

- Strong typing required
- Avoid `any`
- Use clear naming
- Prefer pure functions
- Keep files focused

---

## 🚫 What NOT to Do

- Do not build everything in one file
- Do not skip TOON layer
- Do not tightly couple AI providers
- Do not mix UI and backend logic
- Do not assume synchronous processing
- Do not claim or imply real animal translation in any UI copy

---

## ✅ Goal of All Agents

Ship a working MVP that:

- Accepts a recorded pet session
- Generates structured events via AI vision
- Produces a funny narrated recap video (Experience Recap)
- Simulates a pet's conversational response to user questions (Ask My Pet)
- Generates voiceover for both modes
- Outputs shareable creative content

Focus on execution, clarity, and speed.
