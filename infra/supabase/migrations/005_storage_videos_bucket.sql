-- ── Storage: create `videos` bucket ─────────────────────────────────────────
-- Private bucket — files are NOT publicly accessible via URL.
-- Access is controlled entirely via Supabase Storage RLS policies below.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  524288000,   -- 500 MB in bytes
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
)
on conflict (id) do nothing;

-- ── Storage RLS policies ─────────────────────────────────────────────────────
-- File path convention: videos/{user_id}/{session_id}.mp4
-- The user_id in the path is the first path segment after the bucket root.

-- Allow authenticated users to INSERT their own files
-- (path must start with their user id)
create policy "videos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to SELECT their own files
create policy "videos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to DELETE their own files
create policy "videos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
