import type { SupabaseClient } from "@supabase/supabase-js";
import type { Video, VideoInsert, VideoStatus } from "../types.js";

export async function createVideo(
  db: SupabaseClient,
  data: VideoInsert
): Promise<Video> {
  const { data: row, error } = await db
    .from("videos")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createVideo failed: ${error.message}`);
  return row as Video;
}

export async function getVideoById(
  db: SupabaseClient,
  id: string
): Promise<Video | null> {
  const { data, error } = await db
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Video;
}

export async function updateVideoStatus(
  db: SupabaseClient,
  id: string,
  status: VideoStatus
): Promise<void> {
  const { error } = await db
    .from("videos")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`updateVideoStatus failed: ${error.message}`);
}

export async function listVideosByOwner(
  db: SupabaseClient,
  ownerId: string
): Promise<Video[]> {
  const { data, error } = await db
    .from("videos")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listVideosByOwner failed: ${error.message}`);
  return (data ?? []) as Video[];
}
