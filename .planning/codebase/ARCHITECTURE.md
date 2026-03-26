# ARCHITECTURE.md — Pet POV AI

## Pattern
**Turborepo monorepo** with a clean separation between:
- Apps (deployable services): `api`, `web`, `worker`
- Packages (shared libraries): `ai`, `db`, `personas`, `toon`, `video`

## Layers

```
┌─────────────────────────────────────────┐
│  apps/web  (Next.js 15, App Router)     │  ← User-facing UI
│   └── /app/sessions/[id]/page.tsx       │
│   └── /app/api/ask/route.ts (proxy)     │
├─────────────────────────────────────────┤
│  apps/api  (Express 4, port 4000)       │  ← REST API
│   └── /src/routes/sessions.ts          │     GET/POST sessions
│   └── /src/routes/narrate.ts           │     POST narrate
│   └── /src/routes/upload.ts            │     POST upload
│   └── /src/routes/voice.ts             │     (stub)
├─────────────────────────────────────────┤
│  apps/worker  (BullMQ)                  │  ← Async pipeline
│   └── Pipeline jobs (stubbed for demo) │
├─────────────────────────────────────────┤
│  packages/ai   — LLM clients + prompts  │
│  packages/db   — Supabase types/queries │
│  packages/toon — TOON event encoding    │
│  packages/personas — Persona registry   │
│  packages/video — Remotion composition  │
└─────────────────────────────────────────┘
```

## Data Flow (Demo Happy Path)

```
Browser → GET /sessions/demo-biscuit-tuesday
        → Express returns DEMO_SESSION (in-memory seed)

Browser → POST /sessions/:id/voice
        → Express builds narration via OpenAI GPT-4o
        → Calls ElevenLabs TTS (primary) or OpenAI TTS-1 (fallback)
        → Returns base64 audio URL (cached in-memory Map)

Browser → POST /api/ask (Next.js proxy)
        → Next /app/api/ask/route.ts → Express /sessions/:id/ask
        → OpenAI GPT-4o with species-grounded system prompt
        → Returns pet response JSON
```

## Key Abstractions

| Abstraction | Location | Purpose |
|------------|----------|---------|
| `DEMO_SESSION` | `apps/api/src/routes/sessions.ts` | In-memory seed for demo |
| `DEMO_SESSION_EVENTS` | same | 8 seeded cat events |
| `PERSONA_PRESETS` | same | 5 demo personas (no DB needed) |
| `audioCache` | same | `Map<cacheKey, base64URL>` — prevents re-generation |
| `buildNarrationSystemPrompt(persona, pet?)` | `packages/ai` | Species-grounded prompt |
| `buildAskMyPetSystemPrompt(...)` | `packages/ai` | Q&A prompt with identity grounding |
| `encodeEvents(events)` | `packages/toon` | Converts SessionEvent[] → TOON string |

## Entry Points

| App | Entry | Command |
|-----|-------|---------|
| API | `apps/api/src/index.ts` | `tsx watch src/index.ts` |
| Web | `apps/web/app/layout.tsx` | `next dev` |
| Worker | `apps/worker/src/index.ts` | (not started in demo) |

## State Management
- **Demo:** All state is in-memory (Express process lifetime)
- **Production intent:** Supabase for app state, Cloudinary for media assets
- **Audio cache:** In-memory `Map` — resets on server restart (intentional for demo)
