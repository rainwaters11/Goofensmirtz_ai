# UI/UX Guidelines — Pet POV AI

> This file is the **design authority** for the Pet POV AI frontend.
> It is consumed by coding agents (Copilot, Claude Code, Antigravity) and human developers.
> Follow these rules when building, modifying, or reviewing any UI component or page.

---

## 1. Design Philosophy

Pet POV AI is a **premium creator tool** — not a playful pet app.

The UI should feel like:
- **A professional SaaS dashboard** (think Linear, Vercel, Loom)
- **Clean and editorial** — every element earns its space
- **High trust and high speed** — fast to navigate, obvious to understand
- **Creator-first** — the product gets out of the way and lets the work shine

Avoid:
- Childish or cartoonish styling
- Random colour explosions or gradients for their own sake
- Cluttered enterprise UIs with too many options at once
- Overuse of decorative elements that don't serve the user

---

## 2. Colour System

All colours reference CSS variables defined in `apps/web/app/globals.css`.
Use Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.) — never raw hex values.

| Token                   | Use case                                      |
|-------------------------|-----------------------------------------------|
| `bg-background`         | Page background (white)                       |
| `bg-card`               | Card surfaces                                 |
| `bg-muted`              | Subtle section backgrounds, empty states      |
| `bg-sidebar`            | Dark sidebar surface (slate-900)              |
| `text-foreground`       | Primary body text                             |
| `text-muted-foreground` | Secondary / helper text, placeholders         |
| `bg-primary`            | Brand orange — primary CTA buttons only       |
| `text-primary`          | Brand accent text (active nav, links)         |
| `border-border`         | Default border colour for all containers      |
| `bg-destructive`        | Error states, destructive actions             |
| `bg-accent`             | Hover backgrounds on ghost / outline buttons  |

### Brand Colour Usage Rules

- Use `bg-primary` only for the **most important action** on the page
- Secondary CTAs use `variant="outline"` or `variant="ghost"`
- Never use brand orange for decoration — it must always signal an action
- Status colours (success, warning, error) use the `Badge` component variants

---

## 3. Typography

| Scale      | Tailwind class                             | Use case                         |
|------------|--------------------------------------------|----------------------------------|
| Page title | `text-2xl font-semibold tracking-tight`    | `SectionHeader` title            |
| Card title | `text-base font-semibold`                  | `Card > CardTitle`               |
| Body       | `text-sm`                                  | All body and description text    |
| Helper     | `text-xs text-muted-foreground`            | Metadata, hints, labels          |
| Metric     | `text-3xl font-bold tracking-tight`        | `StatsCard` values               |

Rules:
- No heading larger than `text-2xl` inside the app shell — this is a dashboard, not a landing page
- Line heights should be snug (`leading-snug`) for headings, relaxed for body
- Use `font-semibold` for emphasis, not `font-bold` in running text
- Monospace font (`font-mono`) only for code snippets, API keys, and IDs

---

## 4. Spacing & Layout

- **Padding**: page content uses `px-6 py-8` (desktop: `px-8`)
- **Gap between sections**: `gap-8`
- **Gap inside cards**: `gap-4` to `gap-6`
- **Gap between label and input**: `gap-1.5`
- The dashboard is a **two-panel layout**: fixed sidebar (w-60) + scrollable content
- Content max-width for single-column forms: `max-w-xl mx-auto`
- Content max-width for dashboards: full-width within the content area, using a grid

---

## 5. Component Standards

### Cards
- Use `rounded-xl border bg-card shadow-card` as the base card style
- Internal padding: `p-5` or `p-6`
- Cards should never have coloured backgrounds unless it's a status card
- Use `CardHeader / CardTitle / CardContent / CardFooter` from `components/ui/card.tsx`

### Buttons
- Import from `components/ui/button.tsx`
- Primary CTA: `variant="default"` (brand orange)
- Secondary: `variant="outline"`
- Tertiary / icon: `variant="ghost"`
- Size: `size="default"` for most; `size="lg"` for page-level CTAs; `size="sm"` for inline
- Always include accessible labels (`aria-label`) on icon-only buttons

### Badges
- Import from `components/ui/badge.tsx`
- Use for status indicators only — not as decoration
- Available variants: `default`, `secondary`, `muted`, `success`, `warning`, `processing`, `destructive`
- Never use badges as navigation or interactive elements

### Inputs
- Import from `components/ui/input.tsx`
- Always pair with a visible `<label>` — no placeholder-only labels
- Group label + input in a `flex flex-col gap-1.5` container

### Empty States
- Use `EmptyState` from `components/empty-state.tsx` consistently
- Must include: icon, title, description, and a CTA where appropriate
- Background: `bg-muted/30` with `border-dashed`

### Borders & Radius
- Default border: `border-border` (slate-200)
- Default radius: `rounded-xl` for cards and containers; `rounded-lg` for inputs and buttons
- Dashed borders (`border-dashed`) for empty / placeholder areas only

---

## 6. Navigation & Information Architecture

The sidebar navigation order is intentional — do not reorder without design review:

1. **Dashboard** — overview and recent projects
2. **Projects** — full project list
3. **Upload** — the primary entry action
4. **Personas** — narration personality management
5. **Settings** — config and account

Rules:
- Active nav item uses `bg-primary/15 text-primary` (not a heavy background)
- Sidebar is dark (`bg-sidebar`) — icon and text colours use `text-sidebar-foreground`
- The top nav is minimal: only a mobile hamburger and user avatar
- No mega-menus, dropdowns, or nested navigation

---

## 7. Upload Experience

The upload flow is the **most critical user journey** in the product.

Rules:
- The drop zone must be visually prominent — at least `py-14` tall
- Show drag-over state with `border-primary bg-primary/5`
- Show selected file state clearly (filename, size, option to change)
- Persona selection appears **before** the submit button
- Submit button is disabled until both a file and a persona are selected
- Show inline success / error feedback — no modal alerts
- Button text during upload: "Uploading…" (not "Loading…")

---

## 8. Status & Pipeline Progress

- Use the `ProcessingStatusCard` for pipeline step tracking
- Icons: `CheckCircle2` (complete), `Loader2 animate-spin` (running), `XCircle` (failed), `Circle` (pending)
- Use `Badge` variants for video-level status: `processing`, `warning` (narrated/voiced), `success` (complete)
- Never show raw database enum values — always use the `STATUS_LABELS` map

---

## 9. Mobile Responsiveness

- The sidebar is hidden on mobile (`hidden lg:flex`) — a hamburger appears in `TopNav`
- Tapping the backdrop (overlay) closes the mobile sidebar
- All grids use `grid-cols-1` as base with `sm:grid-cols-2` or `sm:grid-cols-3` breakpoints
- Touch targets are minimum 44×44px (use `p-2` on icon buttons)
- Font sizes never go below `text-xs` on mobile

---

## 10. What NOT to Do

| ❌ Don't                                 | ✅ Do instead                                    |
|------------------------------------------|-------------------------------------------------|
| Hardcode colours (`#f97316`)             | Use Tailwind token (`text-primary`)             |
| Write business logic in components       | Delegate to API — mark with TODO comment        |
| Use `any` in TypeScript                  | Define proper interfaces                        |
| Use emoji as sole visual feedback        | Pair emoji with accessible text                 |
| Add inline styles                        | Use Tailwind utilities only                     |
| Implement auth inside UI components      | Stub with TODO, keep component presentational   |
| Use `<a>` for internal navigation        | Use Next.js `<Link>`                            |
| Put layout logic in page components      | Use `AppShell`, `SectionHeader`, layout slots   |

---

## 11. Component Directory Reference

```
apps/web/
  components/
    ui/               ← Primitives (Button, Card, Badge, Input, Separator)
    dashboard/        ← VideoProjectCard, StatsCard
    upload/           ← UploadCard (drag-drop form)
    persona/          ← PersonaSelector
    projects/         ← ProcessingStatusCard
    app-shell.tsx     ← Root layout shell (client, manages sidebar state)
    sidebar.tsx       ← Left nav (dark, fixed)
    top-nav.tsx       ← Top bar (mobile hamburger + user avatar)
    empty-state.tsx   ← Polished empty state
    section-header.tsx← Page/section title + optional action
    stats-card.tsx    ← Metric card for dashboard overview
  lib/
    utils.ts          ← cn() merge utility
```

---

## 12. Agent Instructions

When generating or modifying frontend code:

1. **Always import `cn` from `../../lib/utils`** (or the relative path to `lib/utils.ts`)
2. **Never hardcode colours** — always use Tailwind token classes
3. **Never add business logic** to presentational components
4. **Always add TODO comments** for data wiring, auth, and backend integration
5. **Use existing primitives** before creating new ones
6. **Maintain the component directory structure** — don't put domain components in `ui/`
7. **Keep pages thin** — heavy logic belongs in components, hooks, or API routes
8. **Check for TypeScript errors** before marking a task complete
9. **Do not install new npm packages** without checking for vulnerabilities first
10. **Run `pnpm build`** to confirm no build regressions after changes
