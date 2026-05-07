# STRUCTURE.md — Pet POV AI

## Top-Level Layout

```
Goofensmirtz_ai/
├── apps/
│   ├── api/           @pet-pov/api — Express REST API
│   ├── web/           @pet-pov/web — Next.js frontend
│   └── worker/        @pet-pov/worker — BullMQ background jobs
├── packages/
│   ├── ai/            @pet-pov/ai — LLM clients and prompt builders
│   ├── db/            @pet-pov/db — Supabase client + types
│   ├── personas/      @pet-pov/personas — Persona definitions
│   ├── toon/          @pet-pov/toon — TOON event encoding
│   └── video/         @pet-pov/video — Remotion video composition
├── docs/              Architecture docs (DATA_ARCHITECTURE.md, etc.)
├── specs/             API and data model specs
├── infra/             Infrastructure config (Supabase migrations, etc.)
├── tools/             Developer tooling scripts
├── .agent/            GSD (Get Shit Done) workflow system
├── .planning/         GSD planning docs (this directory)
├── .env               Local environment variables
├── PRODUCT.md         Product vision and goals
├── HANDOFF.md         Handoff notes
├── turbo.json         Turborepo pipeline config
└── pnpm-workspace.yaml
```

## Key File Locations

### API Routes (`apps/api/src/routes/`)
| File | Route(s) | Status |
|------|---------|--------|
| `sessions.ts` | GET/POST `/sessions/*`, `/voice`, `/ask`, `/recap`, `/insights` | ✅ Working |
| `narrate.ts` | POST `/narrate` | ✅ Implemented |
| `upload.ts` | POST `/upload` | ✅ Working |
| `process.ts` | POST `/process` | Partial |
| `render.ts` | POST `/render` | Stub |
| `ask.ts` | POST `/ask` (top-level) | Legacy |
| `voice.ts` | (voice stub) | Stub |

### Web Pages (`apps/web/app/`)
| Path | Purpose |
|------|---------|
| `page.tsx` | Dashboard — session list |
| `sessions/[id]/page.tsx` | Session detail — full demo experience |
| `personas/page.tsx` | Persona browser |
| `upload/page.tsx` | Upload flow |
| `api/ask/route.ts` | Next.js proxy → Express |

### Shared Packages (`packages/*/src/`)
| Package | Key Files |
|---------|-----------|
| `@pet-pov/ai` | `clients/openai.ts`, `clients/gemini.ts`, `prompts/narration.ts`, `prompts/ask-my-pet.ts`, `insights.ts` |
| `@pet-pov/db` | `index.ts` (Supabase client + type exports) |
| `@pet-pov/toon` | `index.ts` (encodeEvents) |
| `@pet-pov/personas` | Persona type definitions |
| `@pet-pov/video` | Remotion Root + recap composition |

## Naming Conventions
- Files: `kebab-case.ts`
- React components: PascalCase
- API route files: noun (`sessions.ts`, `narrate.ts`) not verb
- Internal package names: `@pet-pov/<name>`
- Demo constants: `DEMO_*` prefix (e.g. `DEMO_SESSION_ID`, `DEMO_SESSION_EVENTS`)
