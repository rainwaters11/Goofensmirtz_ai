-- Pet POV AI — Session Platform Schema
-- Migration: 002_sessions
-- Run with: supabase db push
--
-- Adds the domain model for the expanded product (Experience Recap + Ask My Pet).
-- The original `videos` table is preserved for backwards compatibility.
-- New code should use `sessions` as the primary entity.

-- ─── Pets ─────────────────────────────────────────────────────────────────────

create table if not exists public.pets (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null,
  name                text not null,
  species             text not null,  -- e.g. 'dog', 'cat'
  photo_url           text,
  default_persona_id  uuid references public.personas(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
-- A session is a recorded pet camera upload — the primary entity for both modes.

create table if not exists public.sessions (
  id                   uuid primary key default uuid_generate_v4(),
  owner_id             uuid not null,
  pet_id               uuid references public.pets(id) on delete set null,
  title                text not null,
  cloudinary_url       text not null,
  cloudinary_public_id text not null,
  duration_seconds     numeric,
  status               text not null default 'uploaded'
                         check (status in (
                           'uploaded', 'processing', 'events_extracted',
                           'toon_converted', 'narrated', 'voiced', 'rendered',
                           'complete', 'error'
                         )),
  -- Tracks which pipeline modes have been run on this session
  modes_run            text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── Session Events ───────────────────────────────────────────────────────────
-- AI-extracted structured events from a session (replaces video_events pattern).

create table if not exists public.session_events (
  id             uuid primary key default uuid_generate_v4(),
  session_id     uuid not null references public.sessions(id) on delete cascade,
  events         jsonb not null default '[]',
  toon_snapshot  text,   -- ephemeral debug only; not used in production
  created_at     timestamptz not null default now()
);

-- ─── Conversation Turns ───────────────────────────────────────────────────────
-- Q&A history for Ask My Pet mode — stored per session.

create table if not exists public.conversation_turns (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  persona_id    uuid not null references public.personas(id),
  user_message  text not null,
  pet_response  text not null,
  audio_url     text,   -- TTS audio for the response, if generated
  created_at    timestamptz not null default now()
);

-- ─── Generated Assets ─────────────────────────────────────────────────────────
-- Rendered outputs tied to a session (videos, audio clips, scripts).

create table if not exists public.generated_assets (
  id                   uuid primary key default uuid_generate_v4(),
  session_id           uuid not null references public.sessions(id) on delete cascade,
  mode                 text not null check (mode in ('recap', 'ask-my-pet')),
  type                 text not null check (type in ('video', 'audio', 'script')),
  cloudinary_url       text not null,
  cloudinary_public_id text not null,
  created_at           timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.pets enable row level security;
alter table public.sessions enable row level security;
alter table public.session_events enable row level security;
alter table public.conversation_turns enable row level security;
alter table public.generated_assets enable row level security;

-- TODO: Add RLS policies scoped to auth.uid() = owner_id once auth is configured
-- Example:
-- create policy "Users can access their own sessions"
--   on public.sessions for all
--   using (auth.uid() = owner_id);
