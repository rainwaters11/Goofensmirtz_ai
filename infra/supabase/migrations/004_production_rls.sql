-- Pet POV AI — Production RLS Policies
-- Migration: 004_production_rls
-- Enforces: users can only access their own data (owner_id = auth.uid())
-- Single-pet-per-user: enforced via unique constraint on pets(owner_id)
-- Applied: via Supabase MCP 2026-03-29

-- ── pets ──────────────────────────────────────────────────────────────────────
-- One pet per user — enforce uniqueness at DB level
alter table public.pets
  drop constraint if exists pets_owner_id_unique;
alter table public.pets
  add constraint pets_owner_id_unique unique (owner_id);

drop policy if exists "owners_pets_select"      on public.pets;
drop policy if exists "owners_pets_insert"      on public.pets;
drop policy if exists "owners_pets_update"      on public.pets;
drop policy if exists "owners_pets_delete"      on public.pets;

create policy "owners_pets_select" on public.pets
  for select using (auth.uid() = owner_id);

create policy "owners_pets_insert" on public.pets
  for insert with check (auth.uid() = owner_id);

create policy "owners_pets_update" on public.pets
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners_pets_delete" on public.pets
  for delete using (auth.uid() = owner_id);

-- ── sessions ──────────────────────────────────────────────────────────────────
drop policy if exists "owners_sessions_select"  on public.sessions;
drop policy if exists "owners_sessions_insert"  on public.sessions;
drop policy if exists "owners_sessions_update"  on public.sessions;
drop policy if exists "owners_sessions_delete"  on public.sessions;
drop policy if exists "allow_demo_session_read" on public.sessions;

-- Demo session readable by anyone (unauthenticated users see the demo)
create policy "allow_demo_session_read" on public.sessions
  for select using (id::text = 'demo-biscuit-tuesday' or owner_id is null);

create policy "owners_sessions_select" on public.sessions
  for select using (auth.uid() = owner_id);

create policy "owners_sessions_insert" on public.sessions
  for insert with check (auth.uid() = owner_id);

create policy "owners_sessions_update" on public.sessions
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners_sessions_delete" on public.sessions
  for delete using (auth.uid() = owner_id);

-- ── session_events ────────────────────────────────────────────────────────────
drop policy if exists "owners_session_events_select"    on public.session_events;
drop policy if exists "owners_session_events_insert"    on public.session_events;
drop policy if exists "owners_session_events_update"    on public.session_events;
drop policy if exists "allow_demo_session_events_read"  on public.session_events;

create policy "allow_demo_session_events_read" on public.session_events
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.id::text = 'demo-biscuit-tuesday' or s.owner_id is null)
    )
  );

create policy "owners_session_events_select" on public.session_events
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

create policy "owners_session_events_insert" on public.session_events
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

create policy "owners_session_events_update" on public.session_events
  for update using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

-- ── conversation_turns ────────────────────────────────────────────────────────
drop policy if exists "owners_conversation_turns_select" on public.conversation_turns;
drop policy if exists "owners_conversation_turns_insert" on public.conversation_turns;

create policy "owners_conversation_turns_select" on public.conversation_turns
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

create policy "owners_conversation_turns_insert" on public.conversation_turns
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

-- ── generated_assets ─────────────────────────────────────────────────────────
drop policy if exists "owners_generated_assets_select" on public.generated_assets;
drop policy if exists "owners_generated_assets_insert" on public.generated_assets;

create policy "owners_generated_assets_select" on public.generated_assets
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

create policy "owners_generated_assets_insert" on public.generated_assets
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.owner_id = auth.uid()
    )
  );

-- ── videos (legacy) ───────────────────────────────────────────────────────────
drop policy if exists "owners_videos_select" on public.videos;
drop policy if exists "owners_videos_insert" on public.videos;
drop policy if exists "owners_videos_update" on public.videos;
drop policy if exists "owners_videos_delete" on public.videos;

create policy "owners_videos_select" on public.videos
  for select using (auth.uid() = owner_id);

create policy "owners_videos_insert" on public.videos
  for insert with check (auth.uid() = owner_id);

create policy "owners_videos_update" on public.videos
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners_videos_delete" on public.videos
  for delete using (auth.uid() = owner_id);

-- ── personas (shared library — read by all authenticated users) ───────────────
drop policy if exists "auth_read_personas"    on public.personas;
drop policy if exists "service_write_personas" on public.personas;

create policy "auth_read_personas" on public.personas
  for select using (auth.role() = 'authenticated');

-- NOTE: pipeline_jobs — worker uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- No client-facing policy needed.

-- ── session_avatars ───────────────────────────────────────────────────────────
drop policy if exists "open_session_avatars_read"  on public.session_avatars;
drop policy if exists "auth_session_avatars_insert" on public.session_avatars;

create policy "open_session_avatars_read" on public.session_avatars
  for select using (true);

create policy "auth_session_avatars_insert" on public.session_avatars
  for insert with check (auth.role() = 'authenticated');
