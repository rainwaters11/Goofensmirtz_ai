import Link from "next/link";
import {
  Video,
  Upload,
  TrendingUp,
  MessageSquare,
  Film,
  ArrowRight,
  PawPrint,
  Volume2,
  Clock,
  Play,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "../components/section-header";
import { StatsCard } from "../components/stats-card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

/**
 * Dashboard — character-driven product experience for Pet POV AI.
 * Centers around Goofinsmirtz to tell a story within 5 seconds.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 pb-8">

      {/* ── Hero banner ──────────────────────────────── */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border bg-gradient-to-br from-orange-50 via-amber-50/60 to-white px-8 py-10 shadow-card">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-8 right-32 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: branding + headline */}
          <div className="flex flex-col gap-3 lg:max-w-md">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <PawPrint className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-primary">Pet POV AI</span>
              <span className="flex items-center gap-1.5 ml-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-600">Live perspective</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              See the world<br />
              <span className="text-gradient-brand">through your pet&apos;s eyes.</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Upload your pet camera footage. Get a narrated story, behavioral
              insights, and simulate a conversation — all from your pet&apos;s
              perspective.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row mt-2">
              <Button asChild size="xl" className="animate-glow-pulse">
                <Link href="/upload">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload session
                </Link>
              </Button>
              <Button asChild variant="ghost-brand" size="xl">
                <Link href="/sessions">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Ask Goofinsmirtz
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: narration preview card */}
          <div className="animate-fade-in-up-delay animate-float lg:max-w-sm w-full">
            <Link href="/sessions/demo-biscuit-tuesday" className="block">
            <div className="rounded-xl border bg-white/80 backdrop-blur-sm shadow-panel p-5 flex flex-col gap-3 hover:shadow-lift transition-shadow duration-200">
              {/* Card header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-amber-400/15">
                    <PawPrint className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Goofinsmirtz</span>
                    <span className="text-xs text-muted-foreground">Evening Patrol</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                  <Volume2 className="h-3 w-3 text-primary" />
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 pulse-dot" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                </div>
              </div>

              {/* Narration quote */}
              <div className="rounded-lg bg-gradient-to-br from-orange-50/80 to-amber-50/40 px-4 py-3 border border-primary/8">
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  &ldquo;Something moved near the fence.<br />
                  I stayed low. Watched. Waited.<br />
                  It didn&apos;t belong here.&rdquo;
                </p>
              </div>

              {/* Footer label */}
              <div className="flex items-center justify-between">
                <span className="animate-shimmer rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                  ✦ Generated from real footage
                </span>
                <Badge variant="muted" className="text-[10px]">
                  Dramatic · Loyal
                </Badge>
              </div>
            </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats row (compact / light) ───────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Goofinsmirtz&apos;s activity
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatsCard
            label="Total sessions"
            value={1}
            icon={Video}
            compact
          />
          <StatsCard
            label="Recap videos"
            value={1}
            icon={TrendingUp}
            compact
          />
          <StatsCard
            label="Pet conversations"
            value={3}
            icon={MessageSquare}
            compact
          />
        </div>
      </div>

      {/* ── Recent session (seeded demo) ──────────────── */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Recent sessions"
          action={
            <Link
              href="/sessions"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {/* Demo session card */}
        <Link
          href="/sessions/demo-biscuit-tuesday"
          className="group flex flex-col sm:flex-row gap-4 rounded-xl border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5"
        >
          {/* Thumbnail placeholder */}
          <div className="relative flex-shrink-0 w-full sm:w-44 aspect-video rounded-lg bg-gradient-to-br from-amber-100 to-orange-50 overflow-hidden flex items-center justify-center">
            <Film className="h-8 w-8 text-primary/30" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 shadow-lg">
                <Play className="h-4 w-4 text-white ml-0.5" />
              </div>
            </div>
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              <Clock className="h-2.5 w-2.5" />
              1:24
            </span>
          </div>

          {/* Session meta */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-foreground leading-snug">
                  Goofinsmirtz&apos;s Wild Tuesday
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Complete</Badge>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <PawPrint className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold text-primary">Goofinsmirtz</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              Goofinsmirtz narrates his wild Tuesday: mail carrier standoff → epic couch nap → tennis ball interrogation → suspicious plant investigation → full-speed backyard zoomies.
            </p>
          </div>
        </Link>
      </div>

      {/* ── Two modes section ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Two ways to experience your pet's day"
          description="Both modes run from the same uploaded session."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Experience Recap card */}
          <div className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-amber-400/10">
                <Film className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Mode 1
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-foreground">Experience Recap</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your pet&apos;s footage is analyzed scene by scene. AI generates a
                narrated short-form video from their point of view — funny,
                cinematic, shareable.
              </p>
            </div>
            <Link
              href="/upload"
              className="group/link mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all duration-200"
            >
              Upload footage
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Ask My Pet card — interactive preview */}
          <div className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-400/10">
                <MessageSquare className="h-6 w-6 text-violet-600" strokeWidth={1.5} />
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                Mode 2
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-foreground">Ask Goofinsmirtz</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ask your pet anything. The AI generates a simulated response
                using session events, persona memory, and conversation history.
              </p>
            </div>

            {/* Sample Q&A preview */}
            <div className="flex flex-col gap-2 rounded-lg bg-violet-50/60 border border-violet-100 p-3 mt-auto">
              {/* Question */}
              <div className="flex justify-end">
                <div className="rounded-xl rounded-br-sm bg-violet-600 px-3 py-1.5 text-xs text-white max-w-[85%]">
                  What were you watching near the fence?
                </div>
              </div>
              {/* Answer */}
              <div className="flex gap-2 items-start">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-200 mt-0.5">
                  <PawPrint className="h-2.5 w-2.5 text-violet-700" />
                </div>
                <div className="rounded-xl rounded-bl-sm bg-white border border-violet-100 px-3 py-1.5 text-xs text-foreground/80 max-w-[85%]">
                  Something gray. It moved weird. I don&apos;t trust it.
                </div>
              </div>
            </div>

            {/* Suggested question chips */}
            <div className="flex flex-wrap gap-1.5">
              {["Did you feel safe?", "What's your favorite spot?", "Do you miss me?"].map(
                (q) => (
                  <Link
                    key={q}
                    href="/sessions"
                    className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 hover:scale-105 transition-all duration-150"
                  >
                    {q}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Goofinsmirtz status bar ───────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/20 bg-gradient-to-r from-orange-50/50 to-amber-50/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
          <PawPrint className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            Goofinsmirtz hasn&apos;t gone out yet today
          </span>
          <span className="text-xs text-muted-foreground">
            Last session: Backyard Patrol — 2 hours ago
          </span>
        </div>
        <div className="ml-auto">
          <Button asChild size="sm" variant="ghost-brand">
            <Link href="/upload">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              New session
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
