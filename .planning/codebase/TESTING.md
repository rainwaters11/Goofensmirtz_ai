# TESTING.md — Pet POV AI

## Framework
- **Vitest** 1.6 — configured at monorepo root (`vitest.config.ts`)
- Test command: `pnpm test` (runs `vitest run`)

## Current State
**⚠️ Test coverage is minimal.** The project is in hackathon/demo mode — unit tests were not a priority.

## Existing Test Structure

```
vitest.config.ts (root)
packages/
  toon/
    src/index.test.ts  ← TOON encoding unit tests (likely only package with tests)
```

## What Should Be Tested (gaps)

| Area | Priority | Notes |
|------|----------|-------|
| `packages/ai` prompt builders | High | Species grounding logic — regression risk |
| `encodeEvents()` in `packages/toon` | Medium | Core data transform |
| Express route handlers | Medium | Session endpoint shape, fallback paths |
| ElevenLabs/OpenAI TTS fallback chain | High | Voice endpoint fallback logic is critical for demo |

## Testing Patterns (recommended)

```typescript
// packages/ai/src/prompts/narration.test.ts
import { buildNarrationSystemPrompt } from "./narration";

it("includes species grounding when pet provided", () => {
  const prompt = buildNarrationSystemPrompt(mockPersona, { name: "Goofinsmirtz", species: "cat" });
  expect(prompt).toContain("cat");
  expect(prompt).toContain("Goofinsmirtz");
  expect(prompt).not.toContain("dog"); // regression guard
});
```

## CI / CD
- No CI pipeline configured yet
- Manual testing via curl and browser during development
- Type-check as proxy for test coverage: `pnpm --filter <pkg> exec tsc --noEmit`
