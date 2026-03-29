"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Volume2 } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

interface PetProfile {
  name: string;
  species: string;
  personaId: string;
  personaName: string;
  personaEmoji: string;
  voiceId: string;
  customRules: string;
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
          // Try to persist to DB now that user is authenticated
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("pets").upsert(
              { owner_id: user.id, name: parsed.name, species: parsed.species },
              { onConflict: "owner_id" }
            );
            // Promote pending to canonical profile
            localStorage.setItem("pet-profile", pending);
            localStorage.removeItem("pet-profile-pending");
          }
          setProfile(parsed);
        } catch {
          // ignore — will fall back to existing profile
        }
      }

      // Read canonical profile
      const raw = localStorage.getItem("pet-profile");
      if (raw && !pending) {
        try {
          setProfile(JSON.parse(raw) as PetProfile);
        } catch {
          // ignore parse error
        }
      }

      // Animate in
      setTimeout(() => setPhase("reveal"), 300);
    }

    init();
  }, []);

  useEffect(() => {
    if (phase !== "reveal" || !profile) return;

    // Play voice greeting via the speak API
    async function playGreeting() {
      if (!profile) return;
      setVoicePlaying(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/speak?` +
            new URLSearchParams({
              voiceId: profile.voiceId,
              text: VOICE_GREETING,
            })
        );
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            setVoicePlaying(false);
            URL.revokeObjectURL(url);
            setTimeout(() => setPhase("ready"), 400);
          };
          audio.onerror = () => {
            setVoicePlaying(false);
            setTimeout(() => setPhase("ready"), 800);
          };
          await audio.play();
        } else {
          setVoicePlaying(false);
          setTimeout(() => setPhase("ready"), 800);
        }
      } catch {
        setVoicePlaying(false);
        setTimeout(() => setPhase("ready"), 800);
      }
    }

    // Slight delay so the reveal animation finishes first
    const t = setTimeout(playGreeting, 900);
    return () => clearTimeout(t);
  }, [phase, profile]);

  const traits = profile
    ? (PERSONA_TRAITS[profile.personaId] ?? ["Unique", "One of a Kind", "All Yours"])
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-amber-400/5 blur-3xl" />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center text-center gap-6 transition-all duration-700 ${
          phase === "loading" ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Emoji avatar */}
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400/20 to-amber-500/20 border border-orange-400/20 backdrop-blur-sm text-7xl shadow-xl shadow-orange-500/10">
            {profile?.personaEmoji ?? "🐾"}
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl border border-orange-400/30 animate-ping opacity-30" />
        </div>

        {/* Pet name + persona */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-orange-400/80 uppercase tracking-widest">
            Meet your pet
          </p>
          <h1 className="text-4xl font-black text-white">
            {profile?.name ?? "Your Pet"}
          </h1>
          <p className="text-lg font-semibold text-orange-300">
            {profile?.personaName ?? "The Personality"}
          </p>
        </div>

        {/* Trait chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {traits.map((trait) => (
            <span
              key={trait}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm"
            >
              {trait}
            </span>
          ))}
        </div>

        {/* Profile complete badge */}
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Profile saved to your account
        </div>

        {/* Voice status */}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Volume2 className={`h-3.5 w-3.5 ${voicePlaying ? "text-orange-400 animate-pulse" : ""}`} />
          {voicePlaying
            ? `${profile?.name ?? "Your pet"} is speaking...`
            : phase === "ready"
            ? "Voice greeting complete"
            : "Preparing voice..."}
        </div>

        {/* CTA — appears after voice plays */}
        <button
          onClick={() => router.push("/get-started")}
          disabled={phase !== "ready"}
          className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold transition-all duration-500 ${
            phase === "ready"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/50"
              : "bg-white/5 text-white/20 cursor-default"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Let's go →
        </button>
      </div>
    </div>
  );
}
