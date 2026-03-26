# 🐾 Pet POV AI

Pet POV AI is an **AI-powered pet perspective platform** that transforms recorded pet camera footage into character-driven creative experiences — narrated recap videos and simulated pet conversations.

> See [PRODUCT.md](./PRODUCT.md) for full vision, user flows, and non-goals.

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

## 📄 License

MIT

