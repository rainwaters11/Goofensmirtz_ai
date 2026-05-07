# CONVENTIONS.md — Pet POV AI

## TypeScript Style

- **Strict mode** on all packages (via `tsconfig.base.json`)
- **ESM** in `apps/api` (`"type": "module"`) — use `.js` extensions in imports within ESM packages
- **CJS** fallback pattern where needed for compatibility

## API Route Pattern (Express)

Routes follow a consistent pattern in `apps/api/src/routes/`:

```typescript
// 1. Validate input with Zod
const body = BodySchema.safeParse(req.body);
if (!body.success) {
  res.status(400).json({ error: "...", details: body.error.flatten() });
  return;
}

// 2. Resolve session (demo check first, then DB)
if (id === DEMO_SESSION_ID) {
  // return demo seed data
}

// 3. Happy path with try/catch
try {
  const result = await someOperation();
  res.json({ ...result });
} catch (err) {
  console.error("[route] Error:", err);
  res.json({ fallback: true }); // graceful degradation — never crash
}
```

## Demo-First Pattern

When an endpoint serves both demo and production:
```typescript
const DEMO_SESSION_ID = "demo-biscuit-tuesday";

if (id === DEMO_SESSION_ID) {
  // Use in-memory seed — no Supabase needed
  return res.json({ session: DEMO_SESSION, events: DEMO_SESSION_EVENTS });
}
// Production: hit Supabase
```

## Fallback Architecture

All AI-dependent routes follow a two-level fallback:
1. Try live AI (OpenAI/ElevenLabs/Gemini)
2. Catch error → use `FALLBACK_*` constants
3. Never return 500 if a degraded response is possible

```typescript
if (process.env["OPENAI_API_KEY"]) {
  try {
    result = await generateChatCompletion(...)
  } catch {
    result = FALLBACK_DATA;
  }
} else {
  result = FALLBACK_DATA;
}
```

## Naming Conventions

| Pattern | Example |
|---------|---------|
| Demo seed constants | `DEMO_SESSION`, `DEMO_SESSION_EVENTS`, `FALLBACK_NARRATIONS` |
| Route files | noun-based: `sessions.ts`, `narrate.ts` |
| Package exports | function names: `buildNarrationSystemPrompt`, `encodeEvents` |
| Cache keys | `"sessionId:personaId"` |
| Pet identity | `petName` + `petSpecies` passed explicitly to prevent hallucination |

## Frontend Conventions (Next.js)

- App Router (`app/`) — all pages are Server Components unless marked `"use client"`
- API calls via `lib/api.ts` helper (base URL from `NEXT_PUBLIC_API_URL`)
- Responsive video container: `max-w-2xl mx-auto` + `aspect-video` wrapper
- Tailwind via `cn()` utility (clsx + tailwind-merge)
- Shadcn/ui component pattern (Radix + CVA)

## Error Handling

- Backend: `try/catch` on every async route handler, `next(err)` for unexpected errors
- Frontend: `fallback: boolean` in API responses → amber banner UI, never breaks page
- Voice: `{ audioUrl, cached, fallback }` response shape — UI has 4 states: idle/loading/playing/fallback
