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

> **Rule:** Supabase stores media URL references and Cloudinary public IDs, **never** binary media blobs.
> The UI reads session state from Supabase and uses fields like `video_url` and `thumbnail_url` to stream assets from Cloudinary.
> Application code should consume **asset-role fields** (e.g. `video_url`). Only media upload/sync services should depend on provider-specific concepts like `cloudinary_public_id`.

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
sessions.video_url             — ← asset-role field; app code reads this for playback
                                    production: Cloudinary delivery URL
                                    demo/dev:   local public path stand-in
sessions.cloudinary_public_id  — ← provider-specific; only upload/sync services use this
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

### Asset-role fields (read by application code)

| Field | Meaning |
|-------|---------|
| `video_url` | Raw session video — ready to use in `<video src>` |
| `thumbnail_url` | Poster frame / preview image |
| `rendered_video_url` | Final recap render output |
| `audio_url` | TTS voiceover audio |

Application code should **always read asset-role fields**. These are stable across provider changes.

### Provider-specific fields (only for upload/sync services)

| Field | Meaning |
|-------|---------|
| `cloudinary_public_id` | Cloudinary asset ID — used to build transforms, signed URLs, derived variants |

> **Rule:** Only the media upload route and any Cloudinary sync services should reference `cloudinary_public_id`. The session page, insights engine, and Ask My Pet features should only use `video_url`, `thumbnail_url`, etc.

- `*_url` fields may be local public paths in demo/dev and Cloudinary URLs in production
- Never store raw `blob://` or `file://` paths in Supabase records

---

## Future Variants (TODOs)

- `highlight_clip_url` — short-form shareable clip (add to `sessions` when feature ships)
- `waveform_image_url` — audio waveform visualization asset
- `poster_frame_url` — a specific frame extracted at a timestamp (vs thumbnail)
- Multiple audio takes per persona — use `generated_assets` table, not `sessions`
