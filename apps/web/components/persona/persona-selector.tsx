"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tone: string;
}

interface PersonaSelectorProps {
  /** Controlled selected persona id. Pass null to show unselected state. */
  value?: string | null;
  /** Called whenever the user selects a persona. */
  onChange?: (personaId: string) => void;
  className?: string;
}

// ─── Fallback data (used when the API is unavailable) ─────────────────────────

const FALLBACK_PERSONAS: Persona[] = [
  {
    id: "dramatic-dog",
    name: "Dramatic Dog",
    description: "Theatrical, breathless, treats everything as epic.",
    emoji: "🐕",
    tone: "Cinematic & over-the-top",
  },
  {
    id: "chill-cat",
    name: "Chill Cat",
    description: "Dry, detached, philosophically superior.",
    emoji: "🐈",
    tone: "Deadpan & minimal",
  },
  {
    id: "neighborhood-boss",
    name: "Neighborhood Boss",
    description: "Confident, territorial, matter-of-fact patrol commander.",
    emoji: "🐾",
    tone: "Tactical & authoritative",
  },
  {
    id: "chaotic-gremlin",
    name: "Chaotic Gremlin",
    description: "Hyperactive, unhinged, maximum enthusiasm at all times.",
    emoji: "😈",
    tone: "Unhinged & enthusiastic",
  },
  {
    id: "royal-house-cat",
    name: "Royal House Cat",
    description: "Regal, condescending, effortlessly superior.",
    emoji: "👑",
    tone: "Aristocratic & withering",
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PersonaSelector — radio-style persona picker for the upload flow and settings.
 *
 * Fetches the persona list from GET /api/personas on mount.
 * Falls back to FALLBACK_PERSONAS when the API is unavailable (dev / offline).
 *
 * Fully controlled: pass `value` + `onChange` to integrate into a parent form.
 */
export function PersonaSelector({
  value,
  onChange,
  className,
}: PersonaSelectorProps) {
  const [selected, setSelected] = useState<string | null>(value ?? null);
  const [personas, setPersonas] = useState<Persona[]>(FALLBACK_PERSONAS);
  const [loading, setLoading] = useState(true);

  // ── Sync external value changes ───────────────────────────────────────────
  useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  // ── Fetch persona list from API ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchPersonas() {
      try {
        const res = await fetch(`${API_BASE}/api/personas`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { personas: Persona[] };
        if (!cancelled && Array.isArray(data.personas) && data.personas.length > 0) {
          setPersonas(data.personas);
        }
      } catch {
        // API unavailable — keep the fallback list already set in state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPersonas();
    return () => { cancelled = true; };
  }, []);

  function select(id: string) {
    setSelected(id);
    onChange?.(id);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">
          Choose a persona
        </label>
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {personas.map((persona) => {
          const active = selected === persona.id;

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => select(persona.id)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              {active && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              )}

              <span className="text-2xl">{persona.emoji}</span>

              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {persona.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {persona.description}
                </span>
                <span className="mt-1 text-xs font-medium text-primary/80">
                  {persona.tone}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected == null && (
        <p className="text-xs text-muted-foreground">
          Select a persona to continue.
        </p>
      )}
    </div>
  );
}
