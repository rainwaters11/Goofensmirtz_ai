# INTEGRATIONS.md — Pet POV AI

## AI / LLM

### OpenAI
- **Client:** native `fetch` to `api.openai.com`
- **Models:** GPT-4o (narration, Ask My Pet), TTS-1 (voice fallback)
- **Env:** `OPENAI_API_KEY`
- **Package:** `packages/ai/src/clients/openai.ts`
- **Used for:** `generateChatCompletion()`, TTS fallback in `apps/api/src/routes/sessions.ts`

### Google Gemini
- **Client:** `packages/ai/src/clients/gemini.ts`
- **Env:** `GEMINI_API_KEY`
- **Used for:** Scene analysis, insights generation (`packages/ai/src/insights.ts`)

## Voice / TTS

### ElevenLabs
- **API:** `https://api.elevenlabs.io/v1/text-to-speech/:voiceId`
- **SDK:** `elevenlabs` npm package (installed but native fetch used in route)
- **Voice:** Rachel (`21m00Tcm4TlvDq8ikWAM`) — demo default
- **Env:** `ELEVENLABS_API_KEY`
- **Used in:** `apps/api/src/routes/sessions.ts` POST `/:id/voice` (primary provider)
- **Fallback:** OpenAI TTS-1 (`onyx` voice) if ElevenLabs fails

## Database

### Supabase
- **Client:** `@pet-pov/db` package wraps `@supabase/supabase-js`
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (API), `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (web)
- **Tables:** `sessions`, `pets`, `personas`, `session_events`, `narrations`, `insights`
- **Note:** Demo currently uses in-memory seed data in `apps/api/src/routes/sessions.ts` — Supabase not used for demo session

## Media / CDN

### Cloudinary
- **SDK:** `cloudinary` 2.2
- **Env:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Used for:** Production media uploads (video, audio) — demo uses local `/public/demo/catpov.mp4`
- **Boundary:** Only media upload/sync services use Cloudinary — app code consumes `video_url`, `audio_url` fields

## Frontend → Backend

### Next.js API Routes (proxy)
- `apps/web/app/api/ask/route.ts` → proxies to `http://localhost:4000/api/sessions/:id/ask`
- Pattern: Next.js routes forward to Express; client never hits Express directly in production

### Environment Variables Summary

| Variable | App | Purpose |
|----------|-----|---------|
| `OPENAI_API_KEY` | api | GPT-4o + TTS fallback |
| `ELEVENLABS_API_KEY` | api | Primary TTS |
| `GEMINI_API_KEY` | api | Scene analysis |
| `NEXT_PUBLIC_API_URL` | web | Express base URL |
| `PORT` | api | Express port (default 4000) |
