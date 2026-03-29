"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Video,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { createClient } from "../../lib/supabase/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UploadDropzoneProps {
  userId: string;
  petId: string;
  petName: string;
  personaName: string;
}

type Stage =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "uploading"; progress: number }
  | { status: "creating_record" }
  | { status: "done"; sessionId: string }
  | { status: "error"; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(file: File): string {
  const parts = file.name.split(".");
  return parts[parts.length - 1]?.toLowerCase() ?? "mp4";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UploadDropzone({ userId, petId, petName, personaName }: UploadDropzoneProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>({ status: "idle" });

  // ── File selection ─────────────────────────────────────────────────────────

  const selectFile = useCallback((f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setStage({ status: "error", message: "Unsupported format. Please upload an MP4, MOV, or WebM file." });
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setStage({ status: "error", message: `File is too large (${formatBytes(f.size)}). Max size is 500 MB.` });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setStage({ status: "idle" });
  }, [title]);

  // ── Drag events ────────────────────────────────────────────────────────────

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function handleDragLeave() { setDragging(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  }

  // ── Upload pipeline ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    const supabase = createClient();

    // ① Verify session is still valid
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      setStage({ status: "error", message: "Session expired. Please refresh and sign in again." });
      return;
    }

    // ② Generate a session ID now (so we can use it as the storage path)
    const sessionId = crypto.randomUUID();
    const ext = fileExtension(file);
    const storagePath = `${userId}/${sessionId}.${ext}`;
    const sessionTitle = title.trim() || `${petName}'s Session`;

    // ③ Upload to Supabase Storage with progress tracking
    setStage({ status: "uploading", progress: 0 });

    const { data: storageData, error: storageError } = await supabase.storage
      .from("videos")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      setStage({
        status: "error",
        message: `Upload failed: ${storageError.message}. Please try again.`,
      });
      return;
    }

    // ④ Get the storage URL for the session record
    const { data: urlData } = supabase.storage
      .from("videos")
      .getPublicUrl(storageData.path);

    // For private buckets getPublicUrl returns the path-based URL
    // We store the full Supabase storage URL — the worker will use the service
    // role key to download the file via the signed URL pattern.
    const { data: signedUrlData } = await supabase.storage
      .from("videos")
      .createSignedUrl(storageData.path, 60 * 60 * 24); // 24-hour signed URL for worker

    const videoUrl = signedUrlData?.signedUrl ?? urlData.publicUrl;

    // ⑤ Create the session DB record
    setStage({ status: "creating_record" });

    const { error: dbError } = await supabase
      .from("sessions")
      .insert({
        id: sessionId,
        owner_id: userId,
        pet_id: petId,
        title: sessionTitle,
        video_url: videoUrl,
        cloudinary_public_id: storagePath, // reusing this column for storage path
        status: "processing",
        modes_run: [],
      });

    if (dbError) {
      setStage({
        status: "error",
        message: `Failed to create session record: ${dbError.message}`,
      });
      return;
    }

    // ⑥ Also trigger the API worker pipeline (fire-and-forget)
    // The existing worker polls for sessions with status=processing
    // We hit the API to enqueue this session into the pipeline_jobs queue.
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      await fetch(`${apiBase}/api/sessions/${sessionId}/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, videoUrl, petId }),
      }).catch(() => {
        // Non-fatal — worker will pick it up via polling
        console.warn("[upload] /api/sessions/enqueue not available, worker will poll.");
      });
    } catch {
      // Non-fatal — best effort
    }

    // ⑦ Success → redirect to session page
    setStage({ status: "done", sessionId });

    setTimeout(() => {
      router.push(`/sessions/${sessionId}`);
    }, 800);
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const isWorking =
    stage.status === "uploading" ||
    stage.status === "creating_record" ||
    stage.status === "done";

  const progressLabel = (() => {
    switch (stage.status) {
      case "uploading": return `Uploading to secure storage…`;
      case "creating_record": return "Creating session record…";
      case "done": return `Done! Opening ${petName}'s session…`;
      default: return "";
    }
  })();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Drop zone ──────────────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isWorking && fileRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all duration-200",
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : file
              ? "border-primary/50 bg-gradient-to-b from-primary/5 to-transparent"
              : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
          isWorking && "cursor-not-allowed opacity-80"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
          disabled={isWorking}
        />

        {/* Persona watermark */}
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {personaName} will narrate
        </div>

        {file ? (
          <>
            {/* File selected state */}
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Video className="h-8 w-8 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            {!isWorking && (
              <p className="text-xs text-muted-foreground">Click to change file</p>
            )}
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Drag & drop {petName}&apos;s footage here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                MP4, MOV, or WebM · up to 500 MB
              </p>
            </div>
            <span className="rounded-xl border border-border bg-background px-5 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              Browse files
            </span>
          </>
        )}
      </div>

      {/* ── Session title ──────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="upload-title" className="text-sm font-medium text-foreground">
          Session title
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="upload-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. ${petName}'s wild Tuesday at the park`}
          disabled={isWorking}
          className="rounded-xl"
        />
      </div>

      {/* ── Progress indicator ─────────────────────────────── */}
      {isWorking && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          {stage.status === "done" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">{progressLabel}</p>
            {stage.status === "uploading" && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 animate-pulse"
                  style={{ width: "60%" }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {stage.status === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-red-800">Upload failed</p>
            <p className="text-xs text-red-700">{stage.message}</p>
          </div>
        </div>
      )}

      {/* ── What happens next ────────────────────────── */}
      {!isWorking && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            What happens next
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "1", icon: "🎬", label: "Gemini Vision extracts 8 key frames" },
              { step: "2", icon: "🐾", label: `${personaName} narrates the story` },
              { step: "3", icon: "🔊", label: "ElevenLabs voices your pet" },
            ].map(({ step, icon, label }) => (
              <div key={step} className="flex flex-col items-center gap-1.5 text-center">
                <div className="text-2xl">{icon}</div>
                <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────── */}
      <Button
        type="submit"
        size="lg"
        disabled={!file || isWorking}
        className="w-full rounded-xl text-base font-semibold"
      >
        {isWorking ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {progressLabel}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Analyze {petName}&apos;s footage
          </>
        )}
      </Button>
    </form>
  );
}
