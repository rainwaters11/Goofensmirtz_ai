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
    // Store the public URL; the worker uses service-role key to access private files.
    const { data: urlData } = supabase.storage
      .from("videos")
      .getPublicUrl(storageData.path);

    const videoUrl = urlData.publicUrl;

    // ⑤ Create the session DB record
    setStage({ status: "creating_record" });

    const { error: dbError } = await supabase
      .from("sessions")
      .insert({
        id: sessionId,
        owner_id: user.id,   // use live auth user, not stale prop
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

    console.log("[upload] Session row created:", sessionId, "owner:", user.id);

    console.log("[upload] Session created — session page will trigger Gemini analysis on load.");

    // ⑦ Success → redirect to session page
    setStage({ status: "done", sessionId });

    setTimeout(() => {
      // 🔑 Cache buster — router.refresh() forces Next.js to bypass client-side
      // cache and re-fetch server component data fresh from Supabase, eliminating 404s.
      router.refresh();
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

  const uploadProgress = stage.status === "uploading" ? stage.progress : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* ── Claymorphism Drop Zone ─────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isWorking && fileRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl transition-all duration-200",
          "border-2 border-dashed px-8 py-14 text-center",
          dragging
            ? "border-primary scale-[1.01]"
            : file
              ? "border-primary/40"
              : "border-orange-300 hover:border-primary/50",
          isWorking && "cursor-not-allowed opacity-90"
        )}
        style={{
          background: dragging
            ? "rgba(249,115,22,0.06)"
            : file
            ? "linear-gradient(135deg, rgba(249,115,22,0.04) 0%, rgba(255,247,237,1) 100%)"
            : "rgba(255,247,237,0.8)",
          boxShadow: dragging
            ? "0 0 0 4px rgba(249,115,22,0.15), inset 0 0 24px rgba(249,115,22,0.06), 6px 6px 20px rgba(249,115,22,0.1)"
            : "6px 6px 20px rgba(249,115,22,0.08), -2px -2px 8px rgba(255,255,255,0.9)",
        }}
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

        {/* Persona watermark badge */}
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm">
          <Sparkles className="h-3 w-3" />
          {personaName} will narrate
        </div>

        {file ? (
          <>
            {/* File selected state */}
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-sm">
                <Video className="h-8 w-8 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            {!isWorking && (
              <span className="text-xs text-muted-foreground font-medium underline underline-offset-2">
                Click to change file
              </span>
            )}
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border-2 border-orange-200 shadow-sm">
              <Upload className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">
                {dragging ? `Drop it — ${petName} can't wait!` : `Drag & drop ${petName}'s footage here`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                MP4, MOV, or WebM · up to 500 MB
              </p>
            </div>
            <span className="clay-option rounded-xl border-2 border-orange-200 bg-white px-5 py-2 text-sm font-bold text-primary shadow-sm">
              Browse files
            </span>
          </>
        )}
      </div>

      {/* ── Session title ──────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="upload-title" className="text-sm font-semibold text-foreground">
          Session title
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="upload-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. ${petName}'s wild Tuesday at the park`}
          disabled={isWorking}
          className="clay-input w-full px-4 py-3 text-sm"
        />
      </div>

      {/* ── Clay Progress Indicator ─────────────────────────── */}
      {isWorking && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(255,247,237,1) 100%)",
            border: "2.5px solid rgba(249,115,22,0.2)",
            boxShadow: "4px 4px 14px rgba(249,115,22,0.1), -1px -1px 4px rgba(255,255,255,0.8)",
          }}
        >
          {stage.status === "done" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          )}
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-sm font-bold text-foreground">{progressLabel}</p>
            {stage.status === "uploading" && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100 border border-orange-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500 animate-pulse"
                  style={{ width: uploadProgress > 0 ? `${uploadProgress}%` : "65%" }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {stage.status === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3.5 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold text-red-800">Upload failed</p>
            <p className="text-xs text-red-700">{stage.message}</p>
          </div>
        </div>
      )}

      {/* ── What happens next ────────────────────────── */}
      {!isWorking && (
        <div
          className="flex flex-col gap-3 rounded-2xl px-4 py-4"
          style={{
            border: "2px dashed rgba(249,115,22,0.22)",
            background: "rgba(255,247,237,0.6)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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
                <p className="text-[10px] leading-tight text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Submit CTA ─────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!file || isWorking}
        className="clay-button w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {isWorking ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {progressLabel}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Analyze {petName}&apos;s footage
          </>
        )}
      </button>
    </form>
  );
}
