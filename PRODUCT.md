# PRODUCT.md — Pet POV AI

> Product vision, MVP modes, user flows, and non-goals.
> Keep this file updated as the product evolves.

---

## 🐾 Vision

Pet POV AI is an **AI-powered pet perspective platform** — a creative tool that transforms recorded pet camera footage into character-driven experiences.

The platform doesn't claim to translate animals. It simulates a pet's perspective using structured event analysis, AI narration, and personality-driven voice synthesis — producing content that is funny, emotional, and creator-ready.

---

## 📦 MVP Modes

### Mode 1: Experience Recap

> *"What happened during your walk today?"*

The user uploads footage from a wearable pet camera session. The system analyzes the session, extracts structured events, and generates a narrated short-form video from the pet's point of view.

**User Flow:**
1. User uploads a recorded pet camera session
2. System stores the media (Cloudinary)
3. System extracts scenes and frames (FFmpeg / PySceneDetect)
4. Gemini Vision generates structured `SessionEvent[]` from frames
5. Events are encoded to TOON format
6. OpenAI GPT-4o generates a narration script using the selected `Persona`
7. TTS synthesizes a voiceover in the persona's voice
8. FFmpeg / Remotion renders the final short-form video
9. The rendered asset is returned to the user for download or sharing

**Output:** A rendered short-form video (vertical 9:16) with voiceover and optional captions.

**Target creator:** Pet content creators, wearable camera enthusiasts, social media creators.

---

### Mode 2: Ask My Pet

> *"Where did you go today?" / "What were you thinking when you jumped on the couch?"*

The user selects a recent pet session. The system uses the session's extracted events, the pet's persona, and a memory window to simulate the pet's response to user questions — in voice and text.

**User Flow:**
1. User selects a previously processed `Session`
2. User types or speaks a question (e.g., "What was the best part of your walk?")
3. System retrieves `SessionEvent[]` for the session
4. System encodes events to TOON and combines with conversation history
5. OpenAI GPT-4o generates a simulated pet response in-character
6. TTS synthesizes the response using the persona's voice
7. Response is returned as text + audio to the user

**Output:** A text response + optional audio clip simulating the pet's answer.

**Target user:** Pet owners who want a fun, emotional, interactive experience with their pet's footage.

---

## 🎯 MVP Features

### Both Modes
- [ ] Session upload (recorded video only — no live streaming)
- [ ] Scene extraction and structured event generation
- [ ] Persona-driven narration (Dramatic Dog, Chill Cat, extensible)
- [ ] TTS voice synthesis
- [ ] Supabase storage for sessions, events, personas, and assets

### Experience Recap
- [ ] Rendered short-form video output (FFmpeg / Remotion)
- [ ] Downloadable MP4

### Ask My Pet
- [ ] Conversational Q&A interface
- [ ] Session event context injected into each response
- [ ] Conversation history (per session)
- [ ] Audio response playback

---

## 🚫 Non-Goals (MVP)

The following are explicitly **out of scope** for MVP:

| Non-Goal | Reason |
|---|---|
| Live streaming or real-time inference | Too complex, not needed for MVP value prop |
| Claiming actual animal translation | This is character simulation — not science |
| Multi-pet session management | Single pet per session for MVP simplicity |
| Social feed or sharing platform | Creator exports their own content |
| Video editing UI | Focus on AI pipeline, not editing tools |
| Mobile native app | Web-first for MVP |
| Subscription / billing | Post-MVP monetization layer |

---

## 🐶 Core Domain Entities

| Entity | Description |
|---|---|
| `Pet` | A specific pet profile (name, species, photo) — linked to a persona |
| `Persona` | Narration personality (tone, style, rules, voice mapping) |
| `Session` | A recorded camera session uploaded by the user |
| `SessionEvent` | A structured AI-extracted event from a session (timestamp, subjects, actions, emotion) |
| `ConversationTurn` | A single Q&A turn in Ask My Pet mode |
| `GeneratedAsset` | A rendered video, audio clip, or script tied to a session |

---

## 🗂️ Folder Alignment

```
packages/db/src/types.ts       ← All domain models live here
packages/db/src/queries/       ← sessions.ts, pets.ts, conversations.ts
apps/api/src/routes/           ← /upload, /process, /narrate, /voice, /render, /ask
apps/worker/src/jobs/          ← conversation-generation.ts (Ask My Pet)
```

---

## 📋 Roadmap

### Phase 1 — MVP (current)
- [ ] Experience Recap pipeline (upload → events → narration → render)
- [ ] Ask My Pet conversational endpoint
- [ ] Basic web UI (upload, session detail, ask page)

### Phase 2 — Creator Features
- [ ] Persona customization UI
- [ ] Video caption/subtitle overlay
- [ ] Multi-session memory for Ask My Pet
- [ ] Pet profile management

### Phase 3 — Growth
- [ ] Sharing and export presets (TikTok, Reels, YouTube Shorts)
- [ ] Collaborative sessions
- [ ] API for third-party integrations (wearable camera vendors)

---

## ⚠️ Responsible AI Disclaimer

Pet POV AI uses AI to simulate a pet's perspective for creative and entertainment purposes.

**This is not animal translation.** The system generates fictional narratives based on visual events. It does not interpret or understand animal cognition, emotion, or intent. All outputs are AI-generated creative content — not scientific analysis.
