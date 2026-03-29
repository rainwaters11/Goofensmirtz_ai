"use client";

import Link from "next/link";
import { Film, Clock, ArrowRight, Plus, Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionStatus =
  | "uploaded" | "processing" | "events_extracted" | "toon_converted"
  | "narrated" | "voiced" | "rendered" | "complete" | "error";

export interface FeedSession {
  id: string;
  title: string;
  status: SessionStatus;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  modes_run: string[];
}

interface MemoryFeedProps {
  sessions: FeedSession[];
  petName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<SessionStatus, { label: string; variant: "success" | "processing" | "warning" | "muted" | "destructive" }> = {
  uploaded:         { label: "Uploaded",      variant: "muted" },
  processing:       { label: "Analyzing…",    variant: "processing" },
  events_extracted: { label: "Processing",    variant: "processing" },
  toon_converted:   { label: "Processing",    variant: "processing" },
  narrated:         { label: "Narrated",      variant: "warning" },
  voiced:           { label: "Voiced",        variant: "warning" },
  rendered:         { label: "Rendered",      variant: "success" },
  complete:         { label: "Complete",      variant: "success" },
  error:            { label: "Error",         variant: "destructive" },
};

const TONE_LABELS = ["🎭 Dramatic", "😤 Deadpan", "😈 Chaotic", "👑 Regal", "😰 Worried", "⚡ Feral"];

function getTone(id: string): string {
  // Deterministic pick from session id so it's stable across renders
  const idx = id.charCodeAt(0) % TONE_LABELS.length;
  return TONE_LABELS[idx] ?? "🎭 Dramatic";
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${Math.round(s % 60).toString().padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Memory Card (Polaroid style) ──────────────────────────────────────────────

function MemoryCard({ session, petName }: { session: FeedSession; petName: string }) {
  const badge = STATUS_BADGE[session.status];
  const tone = getTone(session.id);
  const hasStory = session.modes_run?.includes("recap");

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="group flex flex-col rounded-2xl border bg-card shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Polaroid thumbnail */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-amber-100 to-orange-50 overflow-hidden flex items-center justify-center">
        {session.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.thumbnail_url}
            alt={session.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Film className="h-10 w-10 text-primary/20" strokeWidth={1.5} />
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <ArrowRight className="h-5 w-5 text-foreground ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {session.duration_seconds != null && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            <Clock className="h-2.5 w-2.5" />
            {formatDuration(session.duration_seconds)}
          </span>
        )}

        {/* Mood/tone chip */}
        <span className="absolute left-2 top-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
          {tone}
        </span>
      </div>

      {/* Polaroid caption area */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 flex-1">
            {session.title}
          </p>
          <Badge variant={badge.variant} className="shrink-0 text-[10px]">
            {badge.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeAgo(session.created_at)}</span>
          {hasStory && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              Story ready
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary/80 group-hover:gap-2 transition-all">
          Read {petName}&apos;s story <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MemoryFeed({ sessions, petName }: MemoryFeedProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/20 bg-orange-50/40 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
          📷
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">No memories yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload your first video to start building {petName}&apos;s story.
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload first video
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">{petName}&apos;s Memory Feed</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} · Most recent first
          </p>
        </div>
        <Link
          href="/sessions"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Masonry-style grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sessions.map((session) => (
          <MemoryCard key={session.id} session={session} petName={petName} />
        ))}
      </div>
    </div>
  );
}
