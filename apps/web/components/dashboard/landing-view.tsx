import Link from "next/link";
import {
  PawPrint,
  Upload,
  Sparkles,
  ArrowRight,
  Film,
  MessageSquare,
  Volume2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

/**
 * LandingView — shown when the user is NOT authenticated.
 * Preserves the existing marketing hero + preview card from the old page.tsx
 * while routing sign-up through the persona quiz.
 */
export function LandingView() {
  return (
    <div className="flex flex-col gap-10 pb-8">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border bg-gradient-to-br from-orange-50 via-amber-50/60 to-white px-8 py-12 shadow-card">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-8 right-32 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 lg:max-w-md">
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
              Upload pet camera footage. Get a narrated story, behavioral insights,
              and a simulated conversation — all from your pet&apos;s perspective.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row mt-2">
              <Button asChild size="xl" className="animate-glow-pulse">
                <Link href="/personas/setup">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Build your pet&apos;s persona
                </Link>
              </Button>
              <Button asChild variant="ghost-brand" size="xl">
                <Link href="/sessions/demo-biscuit-tuesday">
                  <Film className="mr-2 h-5 w-5" />
                  See the demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Preview card */}
          <div className="animate-fade-in-up-delay animate-float lg:max-w-sm w-full">
            <Link href="/sessions/demo-biscuit-tuesday" className="block">
              <div className="rounded-xl border bg-white/80 backdrop-blur-sm shadow-panel p-5 flex flex-col gap-3 hover:shadow-lift transition-shadow duration-200">
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

                <div className="rounded-lg bg-gradient-to-br from-orange-50/80 to-amber-50/40 px-4 py-3 border border-primary/8">
                  <p className="text-sm leading-relaxed text-foreground/90 italic">
                    &ldquo;I sniffed that trampoline for longer<br />
                    than I&apos;d like to admit.<br />
                    It smelled like mystery.&rdquo;
                  </p>
                </div>

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

      {/* ── Value props ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Upload, title: "Upload footage", desc: "15–60 sec clips from your pet cam or phone.", color: "from-orange-400/20 to-amber-400/10" },
          { icon: Film, title: "AI Story Mode", desc: "Gemini analyzes behaviors. ElevenLabs voices your pet.", color: "from-violet-400/20 to-violet-300/10" },
          { icon: MessageSquare, title: "Ask My Pet", desc: "Chat with a first-person AI persona of your pet.", color: "from-emerald-400/20 to-teal-300/10" },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-card">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
              <Icon className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/20 bg-gradient-to-r from-orange-50/50 to-amber-50/30 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Ready to meet your pet&apos;s inner voice?</p>
          <p className="text-xs text-muted-foreground">Takes 2 minutes. No credit card needed.</p>
        </div>
        <Button asChild>
          <Link href="/personas/setup" className="flex items-center gap-1.5">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
