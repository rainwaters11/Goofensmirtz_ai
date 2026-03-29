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
  uploaded:         { label: "Uploaded",   variant: "muted" },
  processing:       { label: "Analyzing…", variant: "processing" },
  events_extracted: { label: "Processing", variant: "processing" },
  toon_converted:   { label: "Processing", variant: "processing" },
  narrated:         { label: "Narrated",   variant: "warning" },
  voiced:           { label: "Voiced",     variant: "warning" },
  rendered:         { label: "Rendered",   variant: "success" },
  complete:         { label: "Complete",   variant: "success" },
  error:            { label: "Error",      variant: "destructive" },
};

const MOOD_LABELS = ["🎭 Dramatic", "😤 Deadpan", "😈 Chaotic", "👑 Regal", "😰 Worried", "⚡ Feral"];

function getMood(id: string): string {
  const idx = id.charCodeAt(0) % MOOD_LABELS.length;
  return MOOD_LABELS[idx] ?? "🎭 Dramatic";
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

// ── Bento Memory Card ─────────────────────────────────────────────────────────

function MemoryCard({
  session,
  petName,
  index,
}: {
  session: FeedSession;
  petName: string;
  index: number;
}) {
  const badge = STATUS_BADGE[session.status];
  const mood = getMood(session.id);
  const hasStory = session.modes_run?.includes("recap");
  const delayClass = [
    "bento-card-1", "bento-card-2", "bento-card-3",
    "bento-card-4", "bento-card-5", "bento-card-6",
  ][index % 6] ?? "bento-card-1";

  return (
    <Link
      href={`/sessions/${session.id}`}
      className={cn(
        "clay-card group flex flex-col rounded-2xl overflow-hidden cursor-pointer p-0",
        delayClass
      )}
    >
      {/* Thumbnail — 60% of card */}
      <div className="relative w-full bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden flex items-center justify-center" style={{ minHeight: "180px", flex: "0 0 60%" }}>
        {session.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.thumbnail_url}
            alt={session.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ minHeight: "180px" }}
          />
        ) : (
          <Film className="h-12 w-12 text-primary/20" strokeWidth={1.5} />
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(0,0,0,0.22)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <ArrowRight className="h-5 w-5 text-foreground ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {session.duration_seconds != null && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white font-semibold">
            <Clock className="h-2.5 w-2.5" />
            {formatDuration(session.duration_seconds)}
          </span>
        )}

        {/* Mood chip */}
        <span className="absolute left-2 top-2 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white">
          {mood}
        </span>
      </div>

      {/* Frosted glass footer strip */}
      <div className="glass-footer flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 flex-1">
            {session.title}
          </p>
          <Badge variant={badge.variant} className="shrink-0 text-[10px] font-bold">
            {badge.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{timeAgo(session.created_at)}</span>
          {hasStory && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              Story ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
          Read {petName}&apos;s story <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

// ── Main Feed ─────────────────────────────────────────────────────────────────

export function MemoryFeed({ sessions, petName }: MemoryFeedProps) {
  if (sessions.length === 0) {
    return (
      <div className="clay-card flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-primary/25 bg-orange-50/60 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-4xl shadow-sm">
          📷
        </div>
        <div>
          <p className="text-base font-bold text-foreground">No memories yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your first video to start building {petName}&apos;s story.
          </p>
        </div>
        <Link
          href="/upload"
          className="clay-button flex items-center gap-1.5 px-5 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          Upload first video
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-varela, 'Varela Round', sans-serif)" }}
          >
            {petName}&apos;s Memory Feed
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} · Most recent first
          </p>
        </div>
        <Link
          href="/sessions"
          className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Bento-style session grid */}
      <div className="bento-grid">
        {sessions.map((session, i) => (
          <MemoryCard key={session.id} session={session} petName={petName} index={i} />
        ))}
      </div>
    </div>
  );
}
