# Pet POV AI — Data Architecture

## Source of Truth Rules

| Concern | Owner |
|---------|-------|
| Application state & metadata | **Supabase** |
| User/pet/session relationships | **Supabase** |
| Pipeline step status | **Supabase** |
| AI-generated text (narrations, insights, Q&A) | **Supabase** |
| Media URL references | **Supabase** (stores the URL, not the file) |
| Binary video files | **Cloudinary** |
| Binary audio files | **Cloudinary** (or ElevenLabs CDN) |
| Image thumbnails / poster frames | **Cloudinary** |
| Derived/transformed video variants | **Cloudinary** |

> **Rule:** Supabase stores Cloudinary public IDs and delivery URLs, **never** binary media blobs. The UI always reads session state from Supabase and uses the media URLs in those records to stream assets from Cloudinary.

---

## What Supabase Stores

### Core tables

| Table | Purpose |
|-------|---------|
| `users` | Auth + profile |
| `pets` | Pet profiles linked to users |
| `personas` | Narration personality definitions |
| `sessions` | Primary session record (metadata + media URL refs) |
| `session_events` | AI-extracted behavioral events per session |
| `narrations` | Generated narration scripts per session+persona |
| `pipeline_jobs` | Per-step processing status |
| `conversation_turns` | Ask My Pet Q&A history |
| `generated_assets` | Metadata for each produced file (video/audio/script) |

### Key `sessions` fields

```
sessions.id                    — primary key
sessions.owner_id              — FK → users
sessions.pet_id                — FK → pets
sessions.title                 — display name
sessions.status                — pipeline state machine
sessions.duration_seconds      — video length
sessions.cloudinary_public_id  — ← reference to Cloudinary asset
sessions.cloudinary_url        — ← Cloudinary delivery URL (raw upload)
sessions.thumbnail_url         — ← Cloudinary poster frame URL
sessions.rendered_video_url    — ← Cloudinary recap render URL
sessions.audio_url             — ← TTS audio delivery URL
sessions.modes_run             — which pipeline modes have completed
sessions.created_at / updated_at
```

### Key `generated_assets` fields

```
generated_assets.session_id          — FK → sessions
generated_assets.type                — "video" | "audio" | "script"
generated_assets.mode                — "recap" | "ask-my-pet"
generated_assets.cloudinary_url      — ← delivery URL
generated_assets.cloudinary_public_id — ← Cloudinary reference
```

---

## What Cloudinary Stores

| Asset | Cloudinary path convention |
|-------|---------------------------|
| Raw session video (upload) | `sessions/<session_id>/raw` |
| Session thumbnail | `sessions/<session_id>/thumb` |
| Rendered recap video | `sessions/<session_id>/recap` |
| Highlight clip | `sessions/<session_id>/highlight` *(future)* |
| TTS voiceover audio | `sessions/<session_id>/audio/<persona_id>` |
| Waveform image | `sessions/<session_id>/waveform` *(future)* |

> Cloudinary's `public_id` is what Supabase stores — from that, any delivery URL or derived transformation can be reconstructed via the Cloudinary SDK.

---

## Field Naming Conventions

- `*_url` → a full Cloudinary (or CDN) delivery URL, ready to use in `<video src>` or `<img src>`
- `*_public_id` → Cloudinary public ID, used to build transforms (`f_auto`, `q_auto`, etc.)
- Never use `blob://` or local `file://` URLs in Supabase records

---

## Future Variants (TODOs)

- `highlight_clip_url` — short-form shareable clip (add to `sessions` when feature ships)
- `waveform_image_url` — audio waveform visualization asset
- `poster_frame_url` — a specific frame extracted at a timestamp (vs thumbnail)
- Multiple audio takes per persona — use `generated_assets` table, not `sessions`
