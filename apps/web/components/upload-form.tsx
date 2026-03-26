"use client";

import { useState, useRef } from "react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

/**
 * UploadForm — client component for video upload.
 *
 * Sends the selected file to POST /api/upload via multipart/form-data.
 * Delegates all processing to the API and worker; this component only handles UI state.
 */
export function UploadForm() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [title, setTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setState({ status: "uploading", progress: 0 });

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title || file.name);
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
      setState({ status: "success", message: data.message ?? "Uploaded successfully!" });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My dog's wild Tuesday"
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="video" className="text-sm font-medium">
          Video File
        </label>
        <input
          id="video"
          type="file"
          ref={fileRef}
          accept="video/mp4,video/quicktime,video/webm"
          required
          className="rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand file:text-white file:px-3 file:py-1 file:text-sm file:cursor-pointer"
        />
      </div>

      {state.status === "uploading" && (
        <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Uploading… please wait.
        </div>
      )}

      {state.status === "success" && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          ✅ {state.message}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={state.status === "uploading"}
        className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
      >
        {state.status === "uploading" ? "Uploading…" : "Upload & Start Pipeline"}
      </button>
    </form>
  );
}
