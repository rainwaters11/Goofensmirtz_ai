import Link from "next/link";
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
 * Displays thumbnail placeholder, title, status badge, and metadata.
 * Links to the project detail page.
 *
 * TODO: Replace thumbnail placeholder with actual Cloudinary thumbnail URL.
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
  return (
    <Link
      href={`/projects/${id}`}
      className={cn(
        "group flex flex-col rounded-xl border bg-card shadow-card transition-shadow hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* ── Thumbnail ─────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
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

      {/* ── Meta ──────────────────────────────── */}
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
