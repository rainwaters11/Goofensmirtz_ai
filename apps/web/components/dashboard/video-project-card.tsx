import Link from "next/link";
import Image from "next/image";
import { Clock, Film, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge, type BadgeProps } from "../ui/badge";

type VideoStatus =
  | "uploaded"
  | "processing"
  | "events_extracted"
  | "toon_converted"
  | "narrated"
  | "voiced"
  | "rendered"
  | "complete"
  | "error";

interface VideoProjectCardProps {
  id: string;
  title: string;
  status: VideoStatus;
  durationSeconds?: number | null;
  /** Cloudinary (or any CDN) URL for the poster-frame thumbnail. Null until generated. */
  thumbnailUrl?: string | null;
  createdAt: string;
  className?: string;
}

const STATUS_LABELS: Record<VideoStatus, string> = {
  uploaded:         "Uploaded",
  processing:       "Processing",
  events_extracted: "Events Extracted",
  toon_converted:   "TOON Ready",
  narrated:         "Narrated",
  voiced:           "Voiced",
  rendered:         "Rendered",
  complete:         "Complete",
  error:            "Error",
};

const STATUS_VARIANT: Record<VideoStatus, BadgeProps["variant"]> = {
  uploaded:         "muted",
  processing:       "processing",
  events_extracted: "processing",
  toon_converted:   "processing",
  narrated:         "warning",
  voiced:           "warning",
  rendered:         "success",
  complete:         "success",
  error:            "destructive",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * VideoProjectCard — project card for the dashboard grid and projects list.
 *
 * Thumbnail rendering strategy:
 *   1. If thumbnailUrl is provided, render it with next/image (lazy-loaded,
 *      blur-up placeholder, responsive sizes).
 *   2. If the session is still processing, show an animated pulse placeholder.
 *   3. Otherwise, show the Film icon placeholder.
 *
 * Cloudinary thumbnails are served via the delivery URL stored in session.thumbnail_url.
 * The upload route already generates an eager thumbnail transform on ingest.
 */
export function VideoProjectCard({
  id,
  title,
  status,
  durationSeconds,
  thumbnailUrl,
  createdAt,
  className,
}: VideoProjectCardProps) {
  const isProcessing = status === "processing" || status === "events_extracted" || status === "toon_converted";

  return (
    <Link
      href={`/projects/${id}`}
      className={cn(
        "group flex flex-col rounded-xl border bg-card shadow-card transition-shadow hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* ── Thumbnail ─────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
        {thumbnailUrl ? (
          /* Real Cloudinary thumbnail — lazy-loaded with blur-up */
          <Image
            src={thumbnailUrl}
            alt={`Thumbnail for ${title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iOSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIgZmlsbD0iI2UyZThmMCIvPjwvc3ZnPg=="
          />
        ) : isProcessing ? (
          /* Animated pulse while pipeline is running */
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted-foreground/20" />
            <div className="h-2 w-20 animate-pulse rounded-full bg-muted-foreground/15" />
          </div>
        ) : (
          /* Static placeholder for sessions without a thumbnail yet */
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
        )}

        {durationSeconds != null && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            <Clock className="h-3 w-3" />
            {formatDuration(durationSeconds)}
          </span>
        )}
      </div>

      {/* ── Meta ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {title}
          </p>
          {/* TODO: Add project actions menu (rename, delete) */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); }}
            className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-accent hover:text-foreground"
            aria-label="Project options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge variant={STATUS_VARIANT[status]}>
            {STATUS_LABELS[status]}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
