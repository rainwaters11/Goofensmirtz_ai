"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Brain, Mic2, Film, Wand2, Clock } from "lucide-react";
import { SessionRealtimeListener } from "./session-realtime-listener";

interface SessionProcessingViewProps {
  sessionId: string;
  sessionTitle: string;
  status: string;
}

// ── Pipeline steps with dynamic state ────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: "uploaded",         icon: Film,   label: "Video received",            desc: "Uploaded to secure storage" },
  { id: "processing",       icon: Brain,  label: "Gemini Vision analysis",     desc: "Extracting 8 key frames from footage" },
  { id: "events_extracted", icon: Brain,  label: "Behavioural events mapped",  desc: "Understanding what your pet did" },
  { id: "narrated",         icon: Wand2,  label: "Story narration generated",  desc: "Writing your pet's first-person script" },
  { id: "voiced",           icon: Mic2,   label: "ElevenLabs voice rendering", desc: "Your pet finding their voice" },
  { id: "complete",         icon: Film,   label: "Story ready",               desc: "All done — loading your pet's world" },
];

const STATUS_ORDER = ["uploaded", "processing", "events_extracted", "toon_converted", "narrated", "voiced", "complete"];

type StepState = "done" | "running" | "pending";

function getStepState(stepId: string, currentStatus: string): StepState {
  const stepIdx    = STATUS_ORDER.indexOf(stepId);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "running";
  return "pending";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PipelineStep({
  icon: Icon,
  label,
  desc,
  state,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  state: StepState;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
      state === "running"
        ? "border border-primary/20 bg-primary/5"
        : state === "done"
          ? "opacity-60"
          : "opacity-30"
    }`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        state === "running" ? "bg-primary/15" : state === "done" ? "bg-emerald-100" : "bg-muted"
      }`}>
        {state === "running" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : state === "done" ? (
          <Icon className="h-4 w-4 text-emerald-600" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>

      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${
          state === "running" ? "text-primary" : state === "done" ? "text-foreground" : "text-muted-foreground"
        }`}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{desc}</span>
      </div>

      {state === "running" && (
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
          Running
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionProcessingView({
  sessionId,
  sessionTitle,
  status,
}: SessionProcessingViewProps) {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-fade-in-up">

      {/* ── Back nav ─────────────────────────────────── */}
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* ── Hero processing banner ────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white px-8 py-10 shadow-card">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          {/* Animated spinner orb */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/60 shadow-inner border border-primary/10">
            <div className="relative">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                🐾
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Analysing your footage…
              </h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {status === "processing" ? "In progress" : status.replace(/_/g, " ")}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground max-w-md">
              <strong className="text-foreground">&ldquo;{sessionTitle}&rdquo;</strong> is being
              analysed by Gemini Vision. Your pet&apos;s AI story will appear here
              automatically — no refresh needed.
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Usually takes 30–90 seconds depending on video length
            </div>
          </div>
        </div>
      </div>

      {/* ── Pipeline steps ────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Pipeline progress
        </p>

        <div className="flex flex-col gap-2">
          {PIPELINE_STEPS.map(({ id, icon, label, desc }) => (
            <PipelineStep
              key={id}
              icon={icon}
              label={label}
              desc={desc}
              state={getStepState(id, status)}
            />
          ))}
        </div>
      </div>

      {/* ── What to expect panel ─────────────────────── */}
      <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          What you&apos;ll get when it&apos;s done
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { icon: "🎬", title: "Narrated Story",  desc: "A cinematic first-person recap from your pet's POV" },
            { icon: "🔍", title: "AI Insights",     desc: "Behavioral analysis and safety notes from each scene" },
            { icon: "💬", title: "Ask My Pet",      desc: "Chat with your pet's AI persona about their day" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-lg bg-background p-3 border">
              <span className="text-xl shrink-0">{icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{title}</p>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Realtime listener — hidden, watches for completion ── */}
      <SessionRealtimeListener sessionId={sessionId} />
    </div>
  );
}
