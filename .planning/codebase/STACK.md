# STACK.md — Pet POV AI

## Runtime & Language
- **Node.js** ≥20 (all apps and packages)
- **TypeScript** 5.4 (strict, ESM where applicable)
- **pnpm** 9 (workspace package manager)
- **Turborepo** 2 (monorepo build orchestration)

## Apps

### `apps/api` — `@pet-pov/api`
- **Framework:** Express 4.19 (ESM, `type: "module"`)
- **Dev server:** `tsx watch src/index.ts`
- **Validation:** Zod 3.23
- **Job queue:** BullMQ 5.7 (Redis-backed, used in worker)
- **File uploads:** Multer 2.1
- **CORS:** cors 2.8

### `apps/web` — `@pet-pov/web`
- **Framework:** Next.js 15.2.9 (App Router, React 18)
- **Styling:** Tailwind CSS 3.4
- **Components:** Radix UI primitives (Dialog, Label, Progress, Slot), shadcn/ui pattern
- **Icons:** Lucide React 0.383
- **Utilities:** clsx, tailwind-merge, class-variance-authority

### `apps/worker` — `@pet-pov/worker`
- Background job processor (BullMQ)
- Consumes pipeline jobs dispatched from `apps/api`

## Internal Packages

| Package | Purpose |
|---------|--------|
| `@pet-pov/ai` | OpenAI + Gemini clients, prompt builders, insights generation |
| `@pet-pov/db` | Supabase client, type definitions, query helpers |
| `@pet-pov/personas` | Persona definitions and resolution logic |
| `@pet-pov/toon` | TOON event encoding (text serialization of session events) |
| `@pet-pov/video` | Remotion composition for recap video rendering |

## External Dependencies (API)

| Dependency | Version | Use |
|-----------|---------|-----|
| `elevenlabs` | 1.59 | TTS voice generation (primary) |
| `cloudinary` | 2.2 | Media upload and delivery (production) |

## Build & Tooling
- `tsc` for production builds (`dist/`)
- `vitest` 1.6 for testing (root-level config)
- `tsconfig.base.json` extended by all packages
