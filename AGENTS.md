# AGENTS.md

## Project: Pet POV AI

Pet POV AI is an AI-powered content engine that transforms raw pet POV video footage into narrated, personality-driven short-form videos.

This project uses a modular, multi-model pipeline and TOON-based prompt optimization to generate scalable, humorous, and creator-ready content.

---

## 🧠 Core System Flow

All agents must follow this pipeline:

1. Upload video
2. Store media (Cloudinary)
3. Extract scenes (FFmpeg / PySceneDetect)
4. Generate structured events (Gemini or vision model)
5. Store events as JSON
6. Convert JSON → TOON
7. Generate narration (OpenAI)
8. Generate voice (TTS)
9. Render final video (FFmpeg / Remotion)
10. Save and return final output

DO NOT skip steps or merge responsibilities across layers.

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

## 🤖 AI Usage Rules

- NEVER combine perception and narration in one step
- Vision models ONLY generate structured event data
- Narration models ONLY generate scripts

Always follow:

```
Vision → JSON → TOON → Narration
```

---

## 🧾 TOON Rules

- Use TOON only when sending structured data to LLMs
- Keep JSON internally for debugging and storage
- TOON must be deterministic and reversible
- Do not store TOON in database

---

## 🎭 Persona System Rules

- Every narration must use a persona
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

- `/api/upload` → upload only
- `/api/process` → trigger pipeline
- `/api/narrate` → narration only
- `/api/voice` → voice only
- `/api/render` → final video

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

---

## ✅ Goal of All Agents

Ship a working MVP that:

- Accepts a pet video
- Generates structured events
- Produces a funny narrated script
- Generates voiceover
- Outputs a final short-form video

Focus on execution, clarity, and speed.
