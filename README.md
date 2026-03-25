# 🐾 Pet POV AI

Pet POV AI is an end-to-end AI content engine that transforms raw pet camera footage into narrated, personality-driven short-form videos.

---

## 🗂️ Monorepo Structure

```
pet-pov-ai/
├── apps/
│   ├── web/        Next.js frontend (upload UI, preview player)
│   ├── api/        Express API (thin route handlers, delegates to packages)
│   └── worker/     BullMQ worker (all heavy pipeline jobs)
├── packages/
│   ├── ai/         OpenAI + Gemini clients, prompt templates
│   ├── toon/       JSON ↔ TOON encoder/decoder
│   ├── video/      FFmpeg wrapper, scene extraction
│   ├── personas/   Persona types, templates, voice mappings
│   └── db/         Supabase client, typed queries
├── infra/          Supabase migrations, Cloudinary config
├── specs/          End-to-end pipeline tests
├── AGENTS.md       AI agent rules and architecture guidance
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

## 🧠 Pipeline

```
Upload Video
    ↓
Store in Cloudinary
    ↓
Extract Scenes (FFmpeg / PySceneDetect)
    ↓
Generate Structured Events (Gemini Vision)
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
Save & Return Output URL
```

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend   | Express, TypeScript               |
| Worker    | BullMQ, Redis                     |
| AI        | OpenAI GPT-4o, Google Gemini      |
| TTS       | ElevenLabs / OpenAI TTS           |
| Video     | FFmpeg, Cloudinary                |
| Database  | Supabase (PostgreSQL)             |
| Monorepo  | pnpm workspaces, Turborepo        |

---

## 📖 Architecture Rules

See [AGENTS.md](./AGENTS.md) for full architecture and agent guidelines.

---

## 📄 License

MIT

