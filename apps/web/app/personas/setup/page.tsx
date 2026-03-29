"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Chrome,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { createClient, signInWithGoogle } from "../../../lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface PetProfile {
  name: string;
  species: "dog" | "cat" | "rabbit" | "bird" | "other";
  age: string;
  personaId: string;
  personaName: string;
  personaEmoji: string;
  voiceId: string;
  customRules: string;
}

// ── Persona Library ───────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: "chaos-gremlin",
    name: "Chaos Gremlin",
    emoji: "😈",
    tone: "Dramatic & unhinged",
    description: "No remorse. Only chaos. Every moment is a crime scene waiting to happen.",
    species: ["dog", "cat", "rabbit"],
    voiceId: "pNInz6obpgDQGcFmaJgB",
  },
  {
    id: "chill-philosopher",
    name: "Chill Philosopher",
    emoji: "😤",
    tone: "Deadpan & profound",
    description: "Observes everything. Comments on nothing. Occasionally naps on your laptop.",
    species: ["cat", "rabbit"],
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  {
    id: "dramatic-hero",
    name: "Dramatic Hero",
    emoji: "🦸",
    tone: "Cinematic & breathless",
    description: "Treats a squirrel sighting like the final battle in an action film.",
    species: ["dog"],
    voiceId: "VR6AewLTigWG4xSOukaG",
  },
  {
    id: "royal-sophisticate",
    name: "Royal Sophisticate",
    emoji: "👑",
    tone: "Regal & disdainful",
    description: "Was clearly royalty in a past life. Still holds the commoners in contempt.",
    species: ["cat", "bird"],
    voiceId: "TxGEqnHWrfWFTfGW9XjX",
  },
  {
    id: "anxious-overthinker",
    name: "Anxious Overthinker",
    emoji: "😰",
    tone: "Nervous & endearing",
    description: "What if the mail carrier was actually a threat? Just asking.",
    species: ["dog", "rabbit"],
    voiceId: "yoZ06aMxZJJ28mfd3POQ",
  },
  {
    id: "feral-energy",
    name: "Feral Energy",
    emoji: "⚡",
    tone: "Unhinged & joyful",
    description: "3 AM. Full sprint. No explanation. This is the way.",
    species: ["cat", "dog"],
    voiceId: "pNInz6obpgDQGcFmaJgB",
  },
];

const QUIZ_QUESTIONS = [
  {
    question: "When food is being prepared, your pet's behavior is best described as:",
    options: [
      { label: "Professional loitering — maintains eye contact, never blinks", points: { chaos: 2, dramatic: 1 } },
      { label: "Completely unbothered, probably didn't notice", points: { chill: 2 } },
      { label: "Absolutely losing their mind in the best possible way", points: { chaos: 3, feral: 2 } },
      { label: "Sitting at a dignified distance, waiting to be served", points: { royal: 2, dramatic: 1 } },
    ],
  },
  {
    question: "Describe your pet's relationship with strangers:",
    options: [
      { label: "Best friends in 0.5 seconds — they have the social skills you wish you had", points: { dramatic: 2, chaos: 1 } },
      { label: "Cold. Calculating. Will decide if you're worthy in 3-5 business days", points: { royal: 2, chill: 1 } },
      { label: "Suspicious of everyone including the wind", points: { anxious: 3 } },
      { label: "Has already stolen their phone and is running circles around the living room", points: { feral: 3, chaos: 1 } },
    ],
  },
  {
    question: "It's 3 AM. Where is your pet?",
    options: [
      { label: "Monitoring the perimeter. This is not up for debate", points: { anxious: 2, dramatic: 2 } },
      { label: "Running at full speed for no discernible reason", points: { feral: 3, chaos: 2 } },
      { label: "Asleep on your face. This is intentional", points: { chill: 2, royal: 1 } },
      { label: "Starting something. Definitely starting something", points: { chaos: 3 } },
    ],
  },
  {
    question: "How does your pet handle being told 'no'?",
    options: [
      { label: "Immediately does it again while maintaining eye contact", points: { chaos: 3, feral: 1 } },
      { label: "Stares for 30 seconds, then walks away to plot", points: { royal: 3, chill: 1 } },
      { label: "Spirals into visible existential distress", points: { anxious: 3 } },
      { label: "Delivers a monologue through barking/meowing", points: { dramatic: 3 } },
    ],
  },
  {
    question: "Pick the phrase that most accurately describes your pet:",
    options: [
      { label: "ADHD. The chaos. Zero filter.", points: { chaos: 3, feral: 2 } },
      { label: "Zen master. Or just asleep. Both.", points: { chill: 3 } },
      { label: "You are unworthy. I tolerate your presence.", points: { royal: 3 } },
      { label: "I have concerns. Many concerns. About everything.", points: { anxious: 3 } },
    ],
  },
];

function scorePersona(answers: number[], species: string): string {
  const scores: Record<string, number> = {
    chaos: 0, dramatic: 0, chill: 0, royal: 0, anxious: 0, feral: 0,
  };

  answers.forEach((answerIdx, questionIdx) => {
    const q = QUIZ_QUESTIONS[questionIdx];
    if (!q) return;
    const option = q.options[answerIdx];
    if (!option) return;
    Object.entries(option.points).forEach(([key, val]) => {
      scores[key] = (scores[key] ?? 0) + val;
    });
  });

  // Persona ID mapping by dominant score key
  const map: Record<string, string> = {
    chaos: "chaos-gremlin",
    dramatic: "dramatic-hero",
    chill: "chill-philosopher",
    royal: "royal-sophisticate",
    anxious: "anxious-overthinker",
    feral: "feral-energy",
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0]?.[0] ?? "chaos";
  const personaId = map[best] ?? "chaos-gremlin";

  // Filter by species compatibility
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (persona && !persona.species.includes(species as never)) {
    const compatible = PERSONAS.find((p) => p.species.includes(species as never));
    return compatible?.id ?? "chaos-gremlin";
  }

  return personaId;
}

// ── Step Components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PersonaSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Pet info
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<PetProfile["species"] | "">("");
  const [age, setAge] = useState("");

  // Step 2–3: Quiz
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Step 4: Persona + customization
  const [resolvedPersonaId, setResolvedPersonaId] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [customRules, setCustomRules] = useState("");

  const resolvedPersona = PERSONAS.find((p) => p.id === resolvedPersonaId);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleQuizAnswer(answerIdx: number) {
    const newAnswers = [...quizAnswers, answerIdx];
    setQuizAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      // All questions answered — resolve persona
      const personaId = scorePersona(newAnswers, species);
      const persona = PERSONAS.find((p) => p.id === personaId)!;
      setResolvedPersonaId(personaId);
      setSelectedVoiceId(persona.voiceId);
      setStep(4);
    }
  }

  const handleSave = useCallback(async () => {
    if (!resolvedPersona) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // -- Not authenticated — store profile in localStorage temporarily,
        //    then trigger Google sign-in. After callback, /personas/reveal
        //    will pick up the profile and persist it.
        const profile: PetProfile = {
          name: petName,
          species: species as PetProfile["species"],
          age,
          personaId: resolvedPersonaId,
          personaName: resolvedPersona.name,
          personaEmoji: resolvedPersona.emoji,
          voiceId: selectedVoiceId,
          customRules,
        };
        localStorage.setItem("pet-profile-pending", JSON.stringify(profile));
        await signInWithGoogle();
        // Page will redirect — no further action needed here
        return;
      }

      // -- Authenticated — upsert directly to pets table
      const { error: dbError } = await supabase
        .from("pets")
        .upsert(
          {
            owner_id: user.id,
            name: petName,
            species,
            // Store persona info in metadata via the persona name mapping
            // (default_persona_id would require a UUIDs from the personas table)
          },
          { onConflict: "owner_id" }
        );

      if (dbError) throw dbError;

      // Cache in localStorage for fast reads
      const profile: PetProfile = {
        name: petName,
        species: species as PetProfile["species"],
        age,
        personaId: resolvedPersonaId,
        personaName: resolvedPersona.name,
        personaEmoji: resolvedPersona.emoji,
        voiceId: selectedVoiceId,
        customRules,
      };
      localStorage.setItem("pet-profile", JSON.stringify(profile));

      router.push("/personas/reveal");
    } catch (err) {
      console.error("Save error:", err);
      setError("Something went wrong saving your profile. Please try again.");
      setSaving(false);
    }
  }, [petName, species, age, resolvedPersonaId, resolvedPersona, selectedVoiceId, customRules, router]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <PawPrint className="h-5 w-5 text-primary" />
          </div>
          <span className="text-base font-bold text-foreground">Pet POV AI</span>
        </div>

        <ProgressBar step={step} total={4} />

        {/* Step 1: Pet Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tell us about your pet</h1>
              <p className="text-muted-foreground mt-1">
                We'll use this to personalize their AI voice and personality.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  What's their name?
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="e.g. Goofinsmirtz"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  What kind of pet?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["dog", "cat", "rabbit", "bird", "other"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpecies(s)}
                      className={cn(
                        "rounded-xl border py-3 text-sm font-medium capitalize transition-all",
                        species === s
                          ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                          : "border-border bg-white hover:border-primary/40"
                      )}
                    >
                      {s === "dog" ? "🐕 Dog" : s === "cat" ? "🐈 Cat" : s === "rabbit" ? "🐇 Rabbit" : s === "bird" ? "🐦 Bird" : "✨ Other"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  How old are they? (optional)
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 3 years"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!petName || !species}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90 transition-all"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Quiz */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary mb-1">
                Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
              </p>
              <h1 className="text-xl font-bold text-foreground leading-snug">
                {QUIZ_QUESTIONS[currentQuestion]?.question}
              </h1>
            </div>

            <div className="space-y-2.5">
              {QUIZ_QUESTIONS[currentQuestion]?.options.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuizAnswer(idx)}
                  className="w-full text-left rounded-xl border border-border bg-white px-4 py-3.5 text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.99]"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {currentQuestion > 0 && (
              <button
                onClick={() => {
                  setCurrentQuestion((q) => q - 1);
                  setQuizAnswers((prev) => prev.slice(0, -1));
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Previous question
              </button>
            )}
          </div>
        )}

        {/* Step 3: Persona Reveal (calculated from quiz) — auto-advances to step 4 */}
        {/* Step 4: Customize & Save */}
        {step === 4 && resolvedPersona && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary mb-1">
                <Sparkles className="inline h-3 w-3 mr-1" />
                Your pet's personality
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                Meet <span className="text-primary">{petName}</span> —
              </h1>
              <p className="text-lg font-semibold text-foreground mt-0.5">
                {resolvedPersona.emoji} {resolvedPersona.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {resolvedPersona.description}
              </p>
            </div>

            {/* Persona cards — allow override */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block">
                Choose a different personality
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {PERSONAS.filter((p) => p.species.includes(species as never)).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setResolvedPersonaId(p.id);
                      setSelectedVoiceId(p.voiceId);
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-sm transition-all",
                      resolvedPersonaId === p.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-white hover:border-primary/30"
                    )}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-semibold text-foreground text-xs">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">{p.tone}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom rules */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Anything specific to add? <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                placeholder={`e.g. "${petName} is obsessed with squirrels and hates bath time"`}
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-primary/90 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Chrome className="h-4 w-4" />
                  Save Profile &amp; Enable AI
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              You'll sign in with Google to save your pet's profile securely.
            </p>

            <button
              onClick={() => {
                setStep(2);
                setCurrentQuestion(0);
                setQuizAnswers([]);
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retake the quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
