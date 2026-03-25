"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface Persona {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tone: string;
}

interface PersonaSelectorProps {
  personas?: Persona[];
  value?: string | null;
  onChange?: (personaId: string) => void;
  className?: string;
}

/**
 * PersonaSelector — radio-style persona picker for the upload flow.
 *
 * Displays a grid of persona cards. Clicking one selects it and calls onChange.
 * Falls back to built-in placeholder personas when no data is supplied.
 *
 * TODO: Replace PLACEHOLDER_PERSONAS with data fetched from GET /api/personas.
 */

const PLACEHOLDER_PERSONAS: Persona[] = [
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
];

export function PersonaSelector({
  personas = PLACEHOLDER_PERSONAS,
  value,
  onChange,
  className,
}: PersonaSelectorProps) {
  const [selected, setSelected] = useState<string | null>(value ?? null);

  function select(id: string) {
    setSelected(id);
    onChange?.(id);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="text-sm font-medium text-foreground">
        Choose a persona
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
