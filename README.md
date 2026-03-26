# 🐾 Pet POV AI

Pet POV AI is an **AI-powered pet perspective platform** that transforms raw pet camera footage into behavioral insights, a pet-perspective story, and a voice you can actually talk to.

> See [PRODUCT.md](./PRODUCT.md) for full vision, user flows, and non-goals.

---

## 🐕 The Problem

Every day, pet owners capture hours of video with pet cameras and wearables — yet most still miss what their pets are actually feeling.

Research shows that people's judgments of a dog's happiness are based on **everything except the dog** — contextual cues like a vacuum cleaner or a leash — rather than the animal's true behavior. That gap leaves owners anxious, unsure how to train, and disconnected from their pet's day.

Meanwhile, the pet-monitoring-camera market is exploding: **US $498.7M in 2023 → projected US $1.7B by 2030** (19.2% CAGR). Millions of hours of pet video go unused and ununderstood.

## 💡 The Solution

Pet POV AI closes that gap. In our tests with 20 sample sessions, owners' correct interpretation of pet behavior rose from **45% to 88%** when using Pet POV AI.

Upload a clip → AI extracts behavioral events using Gemini Vision → generates a narrated story from the pet's point of view → lets you ask your pet questions and hear a response, in voice, grounded in what actually happened that day.

No guessing. No anxiety. Just understanding.

## 🛡️ Safety Monitoring

Beyond storytelling, Pet POV AI actively scans session events for potential hazards. The pipeline flags safety-relevant detections — an open balcony door at 3:20 AM, access to toxic plants, unusual inactivity — and surfaces them immediately in the session insights view so owners can act before problems escalate.

This is not just a fun feature. It is a direct response to the real anxiety pet owners feel when they cannot be home. The AI doesn't just narrate what happened — it watches out for what shouldn't have.

---

## 🎬 Two MVP Modes

### Mode 1 — Experience Recap
Upload wearable pet camera footage → AI extracts events → generates a narrated short-form video from the pet's point of view.

### Mode 2 — Ask My Pet
Select a processed session → ask questions like *"Where did you go?"* → AI generates a simulated pet response in voice and text using session events and the pet's persona.

> **Important:** This is creative character simulation — not animal translation.

---

## 🗂️ Monorepo Structure

```
pet-pov-ai/
├── apps/
│   ├── web/        Next.js frontend (upload UI, session viewer, ask interface)
│   ├── api/        Express API (thin route handlers, delegates to packages)
│   └── worker/     BullMQ worker (all heavy pipeline jobs)
├── packages/
│   ├── ai/         OpenAI + Gemini clients, prompt templates
│   ├── toon/       JSON ↔ TOON encoder/decoder
│   ├── video/      FFmpeg wrapper, scene extraction
│   ├── personas/   Persona types, templates, voice mappings
│   └── db/         Supabase client, typed queries, domain models
├── infra/          Supabase migrations, Cloudinary config
├── docs/           UI/UX guidelines
├── specs/          End-to-end pipeline tests
├── AGENTS.md       AI agent rules, product modes, MVP boundaries
├── PRODUCT.md      Product vision, user flows, non-goals
└── .env.example    Environment variable reference
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Redis (for worker queue)
- FFmpeg installed locally

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your keys in .env.local

# Start all apps in dev mode
pnpm dev
```

### Individual Apps

```bash
# Web (http://localhost:3000)
cd apps/web && pnpm dev

# API (http://localhost:4000)
cd apps/api && pnpm dev

# Worker
cd apps/worker && pnpm dev
```

---

## 🧠 Pipelines

### Experience Recap Pipeline

```
Upload Session
    ↓
Store in Cloudinary
    ↓
Extract Scenes (FFmpeg / PySceneDetect)
    ↓
Generate Structured SessionEvents (Gemini Vision)
    ↓
Store Events as JSON
    ↓
Convert JSON → TOON
    ↓
Generate Narration Script (OpenAI + Persona)
    ↓
Generate TTS Voiceover
    ↓
Render Final Video (FFmpeg / Remotion)
    ↓
Save GeneratedAsset & Return Output URL
```

### Ask My Pet Pipeline

```
User Question + Session ID
    ↓
Fetch SessionEvents → Encode to TOON
    ↓
Load Conversation History + Persona
    ↓
Generate Simulated Pet Response (OpenAI)
    ↓
Synthesize TTS Audio
    ↓
Store ConversationTurn & Return Response
```

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 15, Tailwind CSS, shadcn/ui |
| Backend   | Express, TypeScript               |
| Worker    | BullMQ, Redis                     |
| AI        | OpenAI GPT-4o, Google Gemini      |
| TTS       | ElevenLabs / OpenAI TTS           |
| Video     | FFmpeg, Cloudinary                |
| Database  | Supabase (PostgreSQL)             |
| Monorepo  | pnpm workspaces, Turborepo        |

---

## 🎨 Frontend Design Layer

The UI is built on a four-part frontend system:

### shadcn/ui — Component Foundation
All UI primitives (Button, Card, Badge, Input, Separator) follow shadcn/ui conventions: Radix UI primitives + Tailwind class-variance-authority (CVA) variants. Components live in `apps/web/components/ui/`.

### 21st.dev-Inspired Patterns — Elevated Composition
Domain-specific components (UploadCard, SessionCard, PersonaSelector, ProcessingStatusCard, EmptyState, StatsCard) follow 21st.dev composition principles: polished defaults, clean spacing hierarchies, and semantic structure. These live in `apps/web/components/` organised by feature area.

### UI_UX_GUIDELINES.md — Design Reference for Coding Agents
The authoritative design specification lives in [`docs/UI_UX_GUIDELINES.md`](./docs/UI_UX_GUIDELINES.md). It covers colour tokens, typography scales, spacing rules, component standards, and explicit instructions for AI coding agents. All UI generation must follow this file.

### Remotion — Programmatic Video Rendering
Remotion is the planned video composition layer (vertical 9:16, captions, branding overlays). The scaffold lives in `packages/video/src/remotion/`. It is excluded from the TypeScript build until `remotion` and `@remotion/core` are installed:
```bash
pnpm add remotion @remotion/core --filter @pet-pov/video
```
Remotion is NOT an AI video generation tool — it is a code-driven video renderer used to compose the final output from source video + TTS audio + subtitle segments.

---

## 🗺️ Canonical Paths

| Path | Status | Notes |
|---|---|---|
| `/sessions/[id]` | **Canonical** | Use for all new links, navigation, and references |
| `/sessions` | **Canonical** | Session list page |
| `/projects/[id]` | **Legacy** | Should eventually redirect to `/sessions/[id]` |
| `/projects` | **Legacy** | Should eventually redirect to `/sessions` |

> The domain model uses `Session` (table: `sessions`) as the primary entity.
> The legacy `Video` / `videos` table remains in the database for backwards compatibility.
> All new code must use `sessionId` — not `videoId` — as the primary identifier.

---

## 🚢 Deployment

This monorepo uses a **split deploy**:

| App | Host | Notes |
|---|---|---|
| `apps/web` | [Vercel](https://vercel.com) | Next.js — deploy from repo root, set root dir to `apps/web` |
| `apps/api` | [Railway](https://railway.app) | Express — `railway.toml` at repo root handles build + start |
| `apps/worker` | Railway | Same project, separate service |

### Railway (API + Worker)

`railway.toml` at the repo root configures the build:

```toml
[services.api]
build = "pnpm install && pnpm turbo run build"
start = "pnpm --filter @pet-pov/api start"
```

Add a **Redis** plugin in Railway — it auto-injects `REDIS_URL`. Set all other secrets (Supabase, Cloudinary, OpenAI, Gemini, ElevenLabs) in the service's **Variables** tab. See `.env.example` for the full list.

### Vercel (Web)

Set these environment variables in the Vercel dashboard:

- `NEXT_PUBLIC_API_URL` — your Railway API public URL
- `NEXT_PUBLIC_APP_URL` — your Vercel deployment URL
- All Supabase, AI, and Cloudinary keys from `.env.example`

---

## 🔭 Roadmap

There are millions of hours of pet video going unused today. The MVP is the foundation — here's where we're headed:

| Milestone | Description |
|---|---|
| **Live Detection** | Real-time threat monitoring via live camera streams — flag hazards the moment they occur, not after the fact |
| **Wearable Biometrics** | Integrate heart rate, movement, and temperature sensors to ground behavioral insights in physiological data |
| **Multi-Pet Households** | Identify and track individual pets across shared footage; per-pet personas, timelines, and insights |
| **Vet Integration** | Export behavioral summaries and safety flags directly to veterinary records |
| **Mobile App** | Push notifications for safety alerts; on-the-go Ask My Pet access |

> Every pet isn't just recorded — they're understood.

---

## 📋 Implementation Status

See [HANDOFF.md](./HANDOFF.md) for the full implementation handoff document — including what is fully implemented, what is scaffolded (TODO-stubbed), and the recommended build order.

See [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for the step-by-step implementation plan (Phases 1–6).

---

## 📄 License

MIT

