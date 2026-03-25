"use client";

import { useRef, useState } from "react";
import { Upload, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

/**
 * UploadCard — enhanced drag-and-drop video upload component.
 *
 * Replaces the plain UploadForm with a polished creator-tool experience:
 * - Drag-and-drop zone with visual feedback
 * - File size and type validation
 * - Title input
 * - Clear success / error states
 *
 * Business logic remains thin: delegates all processing to POST /api/upload.
 * TODO: Add persona selector before submission.
 * TODO: Wire owner_id from auth session.
 */
export function UploadCard({ className }: { className?: string }) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  }

  function selectFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setState({ status: "error", message: "Please select a video file." });
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setState({ status: "error", message: "File exceeds the 500 MB limit." });
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    setState({ status: "idle" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setState({ status: "uploading" });

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title || selectedFile.name);
    // TODO: Replace with actual owner_id from auth session
    formData.append("owner_id", "00000000-0000-0000-0000-000000000000");

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        setState({ status: "error", message: (err as { error: string }).error });
        return;
      }

      const data = await res.json();
      setState({
        status: "success",
        message: data.message ?? "Uploaded! The pipeline is now running.",
      });
      setSelectedFile(null);
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }

  const uploading = state.status === "uploading";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
    >
      {/* ── Drop zone ─────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : selectedFile
              ? "border-primary/50 bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
        />

        {selectedFile ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Click to change file</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Upload className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Drag & drop your pet footage here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                MP4, MOV, or WebM · up to 500 MB
              </p>
            </div>
            <span className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              Browse files
            </span>
          </>
        )}
      </div>

      {/* ── Title input ───────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="upload-title" className="text-sm font-medium text-foreground">
          Project title
        </label>
        <Input
          id="upload-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Biscuit's wild Tuesday at the park"
        />
      </div>

      {/* TODO: Add PersonaSelector here once persona list is wired */}

      {/* ── Feedback ──────────────────────────────── */}
      {state.status === "success" && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* ── Submit ────────────────────────────────── */}
      <Button
        type="submit"
        size="lg"
        disabled={!selectedFile || uploading}
        className="w-full rounded-xl"
      >
        {uploading ? "Uploading…" : "Upload & start pipeline"}
      </Button>
    </form>
  );
}
