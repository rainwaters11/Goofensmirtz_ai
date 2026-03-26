"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Film,
  FileText,
  Mic,
  Play,
  Sparkles,
  Activity,
  Shield,
  Theater,
  CheckCircle2,
  Zap,
  Loader2,
  PawPrint,
} from "lucide-react";
import { SectionHeader } from "../../../components/section-header";
import { ProcessingStatusCard } from "../../../components/projects/processing-status-card";
import { AskMyPetPanel } from "../../../components/ask-my-pet-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import type { Session, SessionEvent, SessionInsights, PetRecap } from "@pet-pov/db";
import { fetchSession, fetchInsights, fetchRecap, generateVoice } from "../../../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_SESSION_ID = "demo-biscuit-tuesday";

// ─── Persona definitions ──────────────────────────────────────────────────────

interface PersonaOption {
  id: string;
  name: string;
  emoji: string;
  color: string;       // active bg + text
  hoverColor: string;  // hover border
}

const PERSONA_OPTIONS: PersonaOption[] = [
  { id: "dramatic-dog", name: "Dramatic Dog", emoji: "🎭", color: "border-primary bg-primary/10 text-primary", hoverColor: "hover:border-primary/40" },
  { id: "neighborhood-boss", name: "Neighborhood Boss", emoji: "🏘️", color: "border-amber-500 bg-amber-50 text-amber-700", hoverColor: "hover:border-amber-400" },
  { id: "chaotic-gremlin", name: "Chaotic Gremlin", emoji: "😈", color: "border-rose-500 bg-rose-50 text-rose-700", hoverColor: "hover:border-rose-400" },
  { id: "royal-house-cat", name: "Royal House Cat", emoji: "👑", color: "border-violet-500 bg-violet-50 text-violet-700", hoverColor: "hover:border-violet-400" },
  { id: "chill-cat", name: "Chill Cat", emoji: "😎", color: "border-teal-500 bg-teal-50 text-teal-700", hoverColor: "hover:border-teal-400" },
];

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-muted/60 ${className}`} />
  );
}

function InsightsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-4 w-24" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12" />
          ))}
        </div>
      </div>
      <SkeletonBlock className="h-20" />
      <SkeletonBlock className="h-12" />
    </div>
  );
}

function RecapSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-40" />
      <SkeletonBlock className="h-16" />
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Data states
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [insights, setInsights] = useState<SessionInsights | null>(null);
  const [recap, setRecap] = useState<PetRecap | null>(null);

  // Loading states
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(true);

  // Persona state
  const [activePersonaId, setActivePersonaId] = useState("dramatic-dog");

  // Generate Story state
  const [generating, setGenerating] = useState(false);
  const [storyGenerated, setStoryGenerated] = useState(false);

  // Voice / TTS state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioFallback, setAudioFallback] = useState(false);

  // Ref to scroll to the Character / narration section after generation
  const characterSectionRef = useRef<HTMLDivElement>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Resolve params promise
  useEffect(() => {
    params.then((p) => setSessionId(p.id));
  }, [params]);

  // Fetch session + insights on mount
  useEffect(() => {
    if (!sessionId) return;

    fetchSession(sessionId)
      .then((data) => {
        setSession(data.session);
        setEvents(data.events);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSession(false));

    fetchInsights(sessionId)
      .then(setInsights)
      .catch((err) => console.warn("Insights fetch failed:", err))
      .finally(() => setLoadingInsights(false));
  }, [sessionId]);

  // Fetch recap (re-fetches when persona changes)
  const loadRecap = useCallback(
    (personaId: string) => {
      if (!sessionId) return;
      setLoadingRecap(true);
      fetchRecap(sessionId, personaId)
        .then(setRecap)
        .catch((err) => console.warn("Recap fetch failed:", err))
        .finally(() => setLoadingRecap(false));
    },
    [sessionId]
  );

  useEffect(() => {
    if (sessionId) loadRecap(activePersonaId);
  }, [sessionId, activePersonaId, loadRecap]);

  // Handle persona switch
  function handlePersonaSwitch(personaId: string) {
    if (personaId === activePersonaId) return;
    setActivePersonaId(personaId);
  }

  // Handle Generate Story — calls recap endpoint, then generates voice
  async function handleGenerateStory() {
    if (!sessionId || generating) return;
    setGenerating(true);
    setStoryGenerated(false);
    try {
      // 1. Get narration text
      const result = await fetchRecap(sessionId, activePersonaId);
      setRecap(result);
      setStoryGenerated(true);

      // 2. Scroll to narration section
      setTimeout(() => {
        characterSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      setTimeout(() => setStoryGenerated(false), 3000);

      // 3. Generate voice (non-blocking — page stays functional if this fails)
      setLoadingAudio(true);
      setAudioFallback(false);
      generateVoice(sessionId, activePersonaId)
        .then((voice) => {
          if (voice.audioUrl) {
            setAudioUrl(voice.audioUrl);
          } else {
            setAudioFallback(true);
          }
        })
        .catch(() => setAudioFallback(true))
        .finally(() => setLoadingAudio(false));
    } catch (err) {
      console.warn("[generateStory] Failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const petName = session?.title?.split("'s")[0] ?? "Pet";
  const durationStr = session?.duration_seconds
    ? formatDuration(session.duration_seconds)
    : "—";
  const dateStr = session?.created_at
    ? new Date(session.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  // Pipeline steps (based on session status)
  const PIPELINE_STEPS = buildPipelineSteps(session?.status ?? "uploaded");

  const activePersona = PERSONA_OPTIONS.find((p) => p.id === activePersonaId) ?? PERSONA_OPTIONS[0]!;

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-foreground">Session not found</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link href="/sessions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sessions
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Back + header ─────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Link
          href="/sessions"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {loadingSession ? (
                <SkeletonBlock className="h-9 w-64" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {session?.title ?? "Loading…"}
                </h1>
              )}
              <StatusBadge status={session?.status ?? "uploaded"} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {loadingSession ? (
                <SkeletonBlock className="inline-block h-4 w-48" />
              ) : (
                <>
                  <PawPrint className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-primary">{petName}</span>
                  <span>·</span>
                  <span>{durationStr}</span>
                  <span>·</span>
                  <span>{dateStr}</span>
                </>
              )}
            </div>
          </div>

          {/* Generate Story CTA */}
          <div className="flex shrink-0 flex-col gap-2">
            <Button
              size="xl"
              className="animate-glow-pulse"
              onClick={handleGenerateStory}
              disabled={generating || loadingSession}
            >
              {generating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : storyGenerated ? (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {generating ? "Generating…" : storyGenerated ? "Story Ready!" : "Generate Story"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {storyGenerated ? "Scroll down to read the narration" : "Creates a narrated recap video"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main grid: content + sidebar ─────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left / main column ──────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* 1. Video preview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Film className="h-4 w-4" />
                Session footage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-xl bg-zinc-950 relative overflow-hidden">
                <video
                  className="w-full rounded-xl"
                  controls
                  playsInline
                  preload="metadata"
                  poster=""
                >
                  <source src="/demo/catpov.mp4" type="video/mp4" />
                  {/* Fallback if video cannot load */}
                  <div className="flex aspect-video items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-white">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
                        <Play className="h-7 w-7 fill-white text-white ml-1" strokeWidth={0} />
                      </div>
                      <p className="text-sm text-white/60">Video unavailable</p>
                    </div>
                  </div>
                </video>
              </div>
            </CardContent>
          </Card>

          {/* 2. Insights panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Activity className="h-4 w-4 text-primary" />
                  Insights — What Happened
                </CardTitle>
                {insights && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Activity</span>
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">
                        {insights.activityScore}/100
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {loadingInsights ? (
                <InsightsSkeleton />
              ) : insights ? (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Key Activities
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {insights.keyActivities.map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                        >
                          <span className="text-lg" aria-hidden>{activity.icon}</span>
                          <span className="text-sm font-medium text-foreground">
                            {activity.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What It Means
                    </p>
                    <div className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3">
                      <p className="text-sm leading-relaxed text-foreground">
                        {insights.behavioralInterpretation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">Safety: </span>
                      {insights.safetyNotes}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Insights unavailable — API may be offline.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 3. Character panel */}
          <Card ref={characterSectionRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Theater className="h-4 w-4 text-primary" />
                Character — {petName}&apos;s Perspective
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Persona selector */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Narrator Persona
                </p>
                <div className="flex flex-wrap gap-2">
                  {PERSONA_OPTIONS.map((persona) => {
                    const isActive = persona.id === activePersonaId;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => handlePersonaSwitch(persona.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? `${persona.color} shadow-sm`
                            : `border-input bg-background text-muted-foreground ${persona.hoverColor} hover:text-foreground`
                        }`}
                      >
                        <span>{persona.emoji}</span>
                        {persona.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Narration script */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
                    Narration Script
                  </p>
                  {loadingRecap && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Switching persona…
                    </div>
                  )}
                </div>
                {loadingRecap ? (
                  <RecapSkeleton />
                ) : recap ? (
                  <div className="rounded-xl bg-amber-50/60 border border-amber-200/60 px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{activePersona.emoji}</span>
                      <span className="text-xs font-semibold text-foreground">
                        {recap.personaName}
                      </span>
                      <Badge variant="muted" className="text-[10px]">
                        Narrating as {petName}
                      </Badge>
                    </div>
                    <div
                      className="space-y-2 text-sm leading-relaxed text-foreground font-medium whitespace-pre-line"
                      style={{ fontFamily: "'Georgia', serif" }}
                    >
                      {recap.narrationScript}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Narration unavailable — API may be offline.
                  </p>
                )}
              </div>

              {/* Audio player */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Mic className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
                  Voiceover
                </p>
                {loadingAudio ? (
                  /* Loading state */
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-5 py-4">
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    <span className="text-sm text-muted-foreground">Generating voice…</span>
                  </div>
                ) : audioUrl ? (
                  /* Real audio player */
                  <div className="rounded-xl border bg-muted/30 px-5 py-4">
                    <audio
                      controls
                      className="w-full h-10 accent-orange-500"
                      src={audioUrl}
                    />
                  </div>
                ) : audioFallback ? (
                  /* Graceful fallback */
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4">
                    <Mic className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-amber-700">Voice unavailable — click Generate Story to try again</span>
                  </div>
                ) : (
                  /* Idle placeholder */
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/30 px-5 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Play className="h-4 w-4 text-primary ml-0.5" />
                    </div>
                    <div className="flex flex-1 items-center gap-0.5 py-1" aria-hidden>
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full bg-primary/25 w-1"
                          style={{ height: `${8 + ((i * 7 + 3) % 20)}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">Click Generate Story</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. Ask My Pet panel */}
          {sessionId && (
            <AskMyPetPanel
              sessionId={sessionId}
              petName={petName}
              personaName={activePersona.name}
              personaId={activePersonaId}
            />
          )}
        </div>

        {/* ── Right sidebar ──────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Pipeline progress */}
          <ProcessingStatusCard steps={PIPELINE_STEPS} />

          {/* Completed features list */}
          <div className="rounded-xl border bg-card p-5 shadow-card flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">
              What you&apos;ll get
            </p>
            {[
              "Narrated recap video",
              "Behavioral insights",
              "Pet personality profile",
              "Shareable short-form clip",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          {/* Active persona card */}
          <div className="rounded-xl border bg-card p-5 shadow-card flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Theater className="h-4 w-4 text-primary" />
              Active Persona
            </p>
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${activePersona.color}`}>
              <span className="text-2xl">{activePersona.emoji}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{activePersona.name}</span>
                <span className="text-xs opacity-75">Narrating as {petName}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Switch personas above to hear {petName}&apos;s story in a different voice.
            </p>
          </div>

          {/* Generate CTA */}
          <div className="rounded-xl border bg-card p-5 shadow-card flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-foreground">
                <Sparkles className="inline h-4 w-4 text-primary mr-1 mb-0.5" />
                Generate Story
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Creates a narrated recap video from {petName}&apos;s perspective using the {activePersona.name} persona.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerateStory}
              disabled={generating || loadingSession}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : storyGenerated ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {generating ? "Generating…" : storyGenerated ? "Story Ready!" : "Generate Story"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    uploaded: { bg: "bg-zinc-100", text: "text-zinc-700", dot: "bg-zinc-400", label: "Uploaded" },
    processing: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500 pulse-dot", label: "Processing" },
    events_extracted: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Events Ready" },
    toon_converted: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Encoded" },
    narrated: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", label: "Narrated" },
    voiced: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", label: "Voiced" },
    complete: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Complete" },
    error: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Error" },
  };

  const c = config[status] ?? config.uploaded!;

  return (
    <div className={`flex items-center gap-1.5 rounded-full ${c.bg} px-3 py-1 text-xs font-semibold ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </div>
  );
}

function buildPipelineSteps(status: string) {
  const statusOrder = [
    "uploaded",
    "processing",
    "events_extracted",
    "toon_converted",
    "narrated",
    "voiced",
    "complete",
  ];
  const current = statusOrder.indexOf(status);

  return [
    { label: "Upload to Cloudinary", status: current >= 0 ? ("complete" as const) : ("pending" as const) },
    { label: "Extract scenes (FFmpeg)", status: current >= 1 ? ("complete" as const) : ("pending" as const) },
    { label: "Generate events (Gemini Vision)", status: current >= 2 ? ("complete" as const) : current === 1 ? ("running" as const) : ("pending" as const) },
    { label: "Convert events to TOON", status: current >= 3 ? ("complete" as const) : current === 2 ? ("running" as const) : ("pending" as const) },
    { label: "Generate narration (GPT-4o)", status: current >= 4 ? ("complete" as const) : current === 3 ? ("running" as const) : ("pending" as const) },
    { label: "Generate voiceover (TTS)", status: current >= 5 ? ("complete" as const) : current === 4 ? ("running" as const) : ("pending" as const) },
    { label: "Render final video", status: current >= 6 ? ("complete" as const) : current === 5 ? ("running" as const) : ("pending" as const) },
  ];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
