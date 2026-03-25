import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineJob, PipelineJobInsert, JobStatus } from "../types.js";

export async function createPipelineJob(
  db: SupabaseClient,
  data: PipelineJobInsert
): Promise<PipelineJob> {
  const { data: row, error } = await db
    .from("pipeline_jobs")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`createPipelineJob failed: ${error.message}`);
  return row as PipelineJob;
}

export async function updateJobStatus(
  db: SupabaseClient,
  id: string,
  status: JobStatus,
  errorMsg?: string
): Promise<void> {
  const patch: Partial<PipelineJob> = { status };

  if (status === "running") {
    patch.started_at = new Date().toISOString();
  }

  if (status === "complete" || status === "failed") {
    patch.completed_at = new Date().toISOString();
  }

  if (errorMsg) {
    patch.error = errorMsg;
  }

  const { error } = await db
    .from("pipeline_jobs")
    .update(patch)
    .eq("id", id);

  if (error) throw new Error(`updateJobStatus failed: ${error.message}`);
}

export async function getJobsForVideo(
  db: SupabaseClient,
  videoId: string
): Promise<PipelineJob[]> {
  const { data, error } = await db
    .from("pipeline_jobs")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getJobsForVideo failed: ${error.message}`);
  return (data ?? []) as PipelineJob[];
}
