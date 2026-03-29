-- ── Dual Identity Image Pipeline ─────────────────────────────────────────────
-- Adds two image columns to pets:
--   original_image_url   — the real photo uploaded by the user
--   persona_avatar_url   — the AI-generated stylized avatar

alter table public.pets
  add column if not exists original_image_url text,
  add column if not exists persona_avatar_url text;

-- ── Avatars storage bucket ────────────────────────────────────────────────────
-- Private bucket for pet photos and AI-generated avatars.
-- Path convention:
--   avatars/{user_id}/original_{timestamp}.{ext}   — real photo
--   avatars/{user_id}/persona_{timestamp}.png       — AI avatar

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  20971520,  -- 20 MB limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ── Storage RLS for avatars ───────────────────────────────────────────────────
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
