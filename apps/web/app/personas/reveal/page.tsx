"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Volume2, ArrowRight } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

interface PetProfile {
  name: string;
  species: string;
  personaId: string;
  personaName: string;
  personaEmoji: string;
  voiceId: string;
  customRules: string;
  originalImageUrl?: string;
  personaAvatarUrl?: string;
}

const PERSONA_TRAITS: Record<string, string[]> = {
  "chaos-gremlin":      ["Mischievous", "Unfiltered", "Zero Regrets"],
  "chill-philosopher":  ["Aloof", "Profound", "Chronically Unbothered"],
  "dramatic-hero":      ["Cinematic", "Breathless", "Treats Everything as Epic"],
  "royal-sophisticate": ["Regal", "Disdainful", "Demands Tribute"],
  "anxious-overthinker":["Vigilant", "Loveable", "Slightly Paranoid"],
  "feral-energy":       ["Chaotic", "Joyful", "3 AM Sprint Enthusiast"],
};

const VOICE_GREETING = "I'm ready to tell my story, human. Let's do this.";

// ── Card Flip Avatar ──────────────────────────────────────────────────────────
// Phase 0: real photo fades in
// Phase 1: card flips out (rotateY 90)
// Phase 2: AI avatar flips in (rotateY -90 → 0)

type FlipPhase = "photo" | "flipping-out" | "flipping-in" | "avatar";

function DualIdentityAvatar({
  profile,
  onFlipComplete,
}: {
  profile: PetProfile;
  onFlipComplete?: () => void;
}) {
  const [flipPhase, setFlipPhase] = useState<FlipPhase>(
    profile.originalImageUrl ? "photo" : "avatar"
  );
  const [label, setLabel] = useState<"real" | "persona">(
    profile.originalImageUrl ? "real" : "persona"
  );

  useEffect(() => {
    if (!profile.originalImageUrl) {
      // No real photo — skip straight to avatar display
      setFlipPhase("avatar");
      setLabel("persona");
      onFlipComplete?.();
      return;
    }

    // Phase 1 → show real photo for 1.5s, then flip
    const t1 = setTimeout(() => {
      setFlipPhase("flipping-out");
    }, 1500);

    // Phase 2 → mid-flip: switch content
    const t2 = setTimeout(() => {
      setFlipPhase("flipping-in");
      setLabel("persona");
    }, 1900); // 1500 + 400ms for flip-out

    // Phase 3 → settled on avatar
    const t3 = setTimeout(() => {
      setFlipPhase("avatar");
      onFlipComplete?.();
    }, 2350);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showReal = flipPhase === "photo" || flipPhase === "flipping-out";
  const showFlipClass = flipPhase === "flipping-out"
    ? "flip-out"
    : flipPhase === "flipping-in"
    ? "flip-in"
    : "";

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* 3D perspective container */}
      <div style={{ perspective: "800px" }}>
        <div
          className={`relative flex h-44 w-44 items-center justify-center rounded-3xl overflow-hidden ${showFlipClass}`}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "0 0 0 4px rgba(249,115,22,0.2), 0 20px 60px rgba(249,115,22,0.25), 8px 8px 32px rgba(249,115,22,0.12)",
            border: "3px solid rgba(249,115,22,0.3)",
          }}
        >
          {showReal && profile.originalImageUrl ? (
            <img
              src={profile.originalImageUrl}
              alt={`Real ${profile.name ?? "pet"}`}
              className="w-full h-full object-cover"
            />
          ) : profile.personaAvatarUrl ? (
            <img
              src={profile.personaAvatarUrl}
              alt={`${profile.name ?? "Pet"} persona avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
              <span className="text-7xl">{profile.personaEmoji ?? "🐾"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Identity label chips — swap with avatar */}
      <div className="flex items-center gap-2 h-7">
        {label === "real" ? (
          <span
            key="real-label"
            className="animate-fade-in-up rounded-full bg-white/90 border border-orange-200 px-3.5 py-1 text-xs font-bold text-foreground shadow-sm"
          >
            Real {profile.name ?? "pet"} 🐾
          </span>
        ) : (
          <span
            key="persona-label"
            className="animate-fade-in-up rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-white shadow-md"
          >
            {profile.personaEmoji} {profile.personaName ?? "Persona"} Mode
          </span>
        )}
      </div>

      {/* Ambient glow ring pulse */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl animate-avatar-glow"
        style={{ top: "-4px", left: "calc(50% - 90px)", width: "180px", height: "176px" }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PersonaRevealPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [phase, setPhase] = useState<"loading" | "reveal" | "ready">("loading");
  const [voicePlaying, setVoicePlaying] = useState(false);

  useEffect(() => {
    async function init() {
      // Check for a pending profile (set before OAuth redirect)
      const pending = localStorage.getItem("pet-profile-pending");
      if (pending) {
        try {
          const parsed = JSON.parse(pending) as PetProfile;
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("pets").upsert(
              {
                owner_id: user.id,
                name: parsed.name,
                species: parsed.species,
                original_image_url: parsed.originalImageUrl ?? null,
                persona_avatar_url: parsed.personaAvatarUrl ?? null,
              },
              { onConflict: "owner_id" }
            );
            localStorage.setItem("pet-profile", pending);
            localStorage.removeItem("pet-profile-pending");
          }
          setProfile(parsed);
        } catch {
          // ignore — will fall back to existing profile
        }
      }

      const raw = localStorage.getItem("pet-profile");
      if (raw && !pending) {
        try {
          setProfile(JSON.parse(raw) as PetProfile);
        } catch {
          // ignore parse error
        }
      }

      setTimeout(() => setPhase("reveal"), 350);
    }

    init();
  }, []);

  useEffect(() => {
    if (phase !== "reveal" || !profile) return;

    async function playGreeting() {
      if (!profile) return;
      setVoicePlaying(true);

      const safetyTimer = setTimeout(() => {
        setVoicePlaying(false);
        setPhase("ready");
      }, 8000);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/speak?` +
            new URLSearchParams({
              voiceId: profile.voiceId,
              text: VOICE_GREETING,
            }),
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            clearTimeout(safetyTimer);
            setVoicePlaying(false);
            URL.revokeObjectURL(url);
            setTimeout(() => setPhase("ready"), 400);
          };
          audio.onerror = () => {
            clearTimeout(safetyTimer);
            setVoicePlaying(false);
            setTimeout(() => setPhase("ready"), 400);
          };
          await audio.play();
        } else {
          clearTimeout(safetyTimer);
          setVoicePlaying(false);
          setTimeout(() => setPhase("ready"), 400);
        }
      } catch {
        clearTimeout(safetyTimer);
        setVoicePlaying(false);
        setTimeout(() => setPhase("ready"), 400);
      }
    }

    const t = setTimeout(playGreeting, 900);
    return () => clearTimeout(t);
  }, [phase, profile]);

  const traits = profile
    ? (PERSONA_TRAITS[profile.personaId] ?? ["Unique", "One of a Kind", "All Yours"])
    : [];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #FDBA74 0%, #FFF7ED 55%, #FED7AA 100%)",
      }}
    >
      {/* Ambient floating particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-orange-400/8 blur-3xl animate-float" />
        <div className="absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-amber-300/10 blur-2xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute left-1/4 bottom-1/4 h-56 w-56 rounded-full bg-orange-500/6 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center text-center gap-7 transition-all duration-700 ${
          phase === "loading" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Dual Identity Avatar — card-flip morph */}
        {profile && (
          <DualIdentityAvatar
            profile={profile}
            onFlipComplete={() => {
              // Avatar flip done — voice already playing by this point
            }}
          />
        )}

        {/* Pet name + persona */}
        {profile && (
          <div className="space-y-1.5 animate-fade-in-up-delay">
            <p
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "rgba(154,52,18,0.7)" }}
            >
              Meet your pet
            </p>
            <h1
              className="text-5xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-varela, 'Varela Round', sans-serif)" }}
            >
              {profile.name ?? "Your Pet"}
            </h1>
            <p className="text-xl font-bold text-primary">
              {profile.personaName ?? "The Personality"}
            </p>
          </div>
        )}

        {/* Trait chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {traits.map((trait, i) => (
            <span
              key={trait}
              className="clay-card rounded-full px-3.5 py-1.5 text-xs font-bold text-foreground animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, borderRadius: "9999px" }}
            >
              {trait}
            </span>
          ))}
        </div>

        {/* Profile saved badge */}
        <div className="clay-card flex items-center gap-2 px-4 py-2 rounded-full" style={{ borderRadius: "9999px" }}>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold text-foreground">Profile saved to your account</span>
        </div>

        {/* Voice indicator */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Volume2 className={`h-4 w-4 ${voicePlaying ? "text-primary animate-pulse" : ""}`} />
          {voicePlaying
            ? `${profile?.name ?? "Your pet"} is speaking...`
            : phase === "ready"
            ? "Voice greeting complete ✓"
            : "Preparing voice..."}
        </div>

        {/* CTA — unlocks after voice */}
        <button
          onClick={() => router.push("/get-started")}
          disabled={phase !== "ready"}
          className={`clay-button flex items-center gap-2.5 px-8 py-4 text-sm transition-all duration-500 ${
            phase === "ready"
              ? "opacity-100 scale-100 animate-glow-pulse"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Let's go
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
