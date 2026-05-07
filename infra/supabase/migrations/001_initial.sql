-- Pet POV AI — Initial Schema
-- Migration: 001_initial
-- Run with: supabase db push

-- ─── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Videos ───────────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null,
  title               text not null,
  cloudinary_url      text not null,
  cloudinary_public_id text not null,
  duration_seconds    numeric,
  status              text not null default 'uploaded'
                        check (status in (
                          'uploaded', 'processing', 'events_extracted',
                          'toon_converted', 'narrated', 'voiced', 'rendered',
                          'complete', 'error'
                        )),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Scene Events ─────────────────────────────────────────────────────────────
create table if not exists public.video_events (
  id             uuid primary key default uuid_generate_v4(),
  video_id       uuid not null references public.videos(id) on delete cascade,
  events         jsonb not null default '[]',
  toon_snapshot  text,   -- ephemeral debug only; not used in production
  created_at     timestamptz not null default now()
);

-- ─── Personas ─────────────────────────────────────────────────────────────────
create table if not exists public.personas (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null unique,
  tone         text not null,
  style        text not null,
  rules        text[] not null default '{}',
  voice_id     text not null,
  tts_provider text not null default 'elevenlabs'
                 check (tts_provider in ('elevenlabs', 'openai', 'google')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Narrations ───────────────────────────────────────────────────────────────
create table if not exists public.narrations (
  id          uuid primary key default uuid_generate_v4(),
  video_id    uuid not null references public.videos(id) on delete cascade,
  persona_id  uuid not null references public.personas(id),
  script      text not null,
  voice_url   text,
  created_at  timestamptz not null default now()
);

-- ─── Pipeline Jobs ────────────────────────────────────────────────────────────
create table if not exists public.pipeline_jobs (
  id           uuid primary key default uuid_generate_v4(),
  video_id     uuid not null references public.videos(id) on delete cascade,
  step         text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'running', 'complete', 'failed')),
  error        text,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.videos enable row level security;
alter table public.video_events enable row level security;
alter table public.personas enable row level security;
alter table public.narrations enable row level security;
alter table public.pipeline_jobs enable row level security;

-- TODO: Add RLS policies scoped to auth.uid() = owner_id once auth is configured
