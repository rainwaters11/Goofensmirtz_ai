# CONCERNS.md — Pet POV AI

## Critical Demo Issues

### 1. Narration doesn't match the actual video ⚠️ HIGH
- **Problem:** `DEMO_SESSION_EVENTS` in `apps/api/src/routes/sessions.ts` are hardcoded generic events (doorbell, couch nap, zoomies, plant). The cat video (`/demo/catpov.mp4`) likely shows different actions. The narration is generated from the hardcoded events, never from the actual footage.
- **Impact:** Judges watching the video will see Goofinsmirtz doing X while the narration says something unrelated.
- **Fix:** Run Gemini Vision on `catpov.mp4` to extract real events → replace `DEMO_SESSION_EVENTS` with video-accurate events.

### 2. API server requires manual env var injection on restart ⚠️ MEDIUM
- **Problem:** `pnpm dev` from the API directory doesn't reliably load `.env` when spawned as a background process. Requires explicit env var prefix on the command.
- **Impact:** After every restart, must run: `ELEVENLABS_API_KEY=... PORT=4000 node_modules/.bin/tsx src/index.ts`
- **Fix:** Add `dotenv-cli` or use `tsx --env-file=../../.env` (Node 20 `--env-file` flag).

### 3. Audio cache is in-memory only ⚠️ MEDIUM
- **File:** `apps/api/src/routes/sessions.ts` — `const audioCache = new Map()`
- **Impact:** Every API server restart clears the voice cache. Will re-bill ElevenLabs on first play after restart during demo.
- **Fix:** Write audio to `/tmp/` on disk with a stable filename, check file existence before calling ElevenLabs.

## Technical Debt

### 4. Worker pipeline fully stubbed
- `apps/worker/` jobs are all stubs — the async pipeline (upload → extract events → narrate → render) doesn't run
- Demo relies on synchronous API routes only

### 5. Supabase not used for demo session
- All demo data is in-memory in `sessions.ts` (`DEMO_SESSION`, `DEMO_SESSION_EVENTS`, `PERSONA_PRESETS`)
- The `narrate.ts` Supabase implementation will 404 on demo session (demo session not in DB)
- Two code paths exist and must be kept aligned

### 6. `POST /narrate` uses Supabase but demo session is not in DB
- `narrate.ts` fetches `session_events` from Supabase for the given `sessionId`
- `demo-biscuit-tuesday` doesn't exist in Supabase — will 404
- No bridge between in-memory demo data and the narrate route

### 7. FFmpeg / video merge is a stub
- `mergeAudioWithVideo()` is not implemented
- Shareable recap video (audio + video merged) is not functional

## Security / Config

### 8. API keys in process environment only
- No secret manager — all keys in `.env`
- `.env` is gitignored correctly
- `OPENAI_API_KEY` is long-lived project key — consider rotating post-demo

### 9. CORS is open (`*` in dev)
- Verify `apps/api/src/index.ts` CORS config before any production deploy

## Performance

### 10. Base64 audio URLs are large
- ElevenLabs returns ~35KB of audio → base64 is ~47KB per request
- Acceptable for demo; for production, upload to Cloudinary and return delivery URL instead
