"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Chrome,
  Camera,
  X,
  Upload,
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
  originalImageUrl: string | undefined;    // real photo in Supabase Storage
  personaAvatarUrl: string | undefined;   // AI-generated stylized avatar
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

  const persona = PERSONAS.find((p) => p.id === personaId);
  if (persona && !persona.species.includes(species as never)) {
    const compatible = PERSONAS.find((p) => p.species.includes(species as never));
    return compatible?.id ?? "chaos-gremlin";
  }

  return personaId;
}

// ── Progress Pill ─────────────────────────────────────────────────────────────

function ProgressPill({ step, total }: { step: number; total: number }) {
  return (
    <div className="progress-pill flex items-center gap-3 mb-8 self-start">
      <span className="text-xs font-semibold text-primary">
        Step {step} of {total}
      </span>
      <div className="h-1.5 w-24 rounded-full overflow-hidden bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground font-medium">
        {Math.round((step / total) * 100)}%
      </span>
    </div>
  );
}

// ── Animated Step Wrapper ─────────────────────────────────────────────────────

function AnimatedStep({ children, stepKey }: { children: React.ReactNode; stepKey: string | number }) {
  return (
    <div key={stepKey} className="step-enter w-full">
      {children}
    </div>
  );
}

// ── Species selector ──────────────────────────────────────────────────────────

const SPECIES_OPTIONS = [
  { value: "dog" as const,    label: "🐕 Dog" },
  { value: "cat" as const,    label: "🐈 Cat" },
  { value: "rabbit" as const, label: "🐇 Rabbit" },
  { value: "bird" as const,   label: "🐦 Bird" },
  { value: "other" as const,  label: "✨ Other" },
];

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

  // Step 1: Pet photo (dual identity)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [personaAvatarUrl, setPersonaAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Quiz
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Step 4: Persona + customization
  const [resolvedPersonaId, setResolvedPersonaId] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [customRules, setCustomRules] = useState("");

  const resolvedPersona = PERSONAS.find((p) => p.id === resolvedPersonaId);

  // ── Photo upload handler ─────────────────────────────────────────────────────

  const handlePhotoSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setPhotoUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? `anon_${Date.now()}`;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/original_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (!uploadErr && uploadData) {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(uploadData.path, 60 * 60 * 24 * 30);
        const url = signed?.signedUrl ?? null;
        setOriginalImageUrl(url);
        if (url && user?.id) {
          triggerAvatarGeneration(url, user.id);
        }
      } else {
        console.warn("[photo-upload] Upload failed:", uploadErr);
      }
    } catch (err) {
      console.warn("[photo-upload] Unexpected error:", err);
    } finally {
      setPhotoUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function triggerAvatarGeneration(imageUrl: string, userId: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/pets/generate-avatar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ originalImageUrl: imageUrl, userId, petId: "pending" }),
        }
      );
      if (res.ok) {
        const data = await res.json() as { personaAvatarUrl?: string };
        if (data.personaAvatarUrl) setPersonaAvatarUrl(data.personaAvatarUrl);
      }
    } catch (err) {
      console.warn("[avatar-gen] Non-fatal background error:", err);
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleQuizAnswer(answerIdx: number) {
    const newAnswers = [...quizAnswers, answerIdx];
    setQuizAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
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
        const profile = {
          name: petName,
          species: species as PetProfile["species"],
          age,
          personaId: resolvedPersonaId,
          personaName: resolvedPersona.name,
          personaEmoji: resolvedPersona.emoji,
          voiceId: selectedVoiceId,
          customRules,
          originalImageUrl: originalImageUrl ?? undefined,
          personaAvatarUrl: personaAvatarUrl ?? undefined,
        } satisfies Partial<PetProfile> as PetProfile;
        localStorage.setItem("pet-profile-pending", JSON.stringify(profile));
        await signInWithGoogle();
        return;
      }

      const { error: dbError } = await supabase
        .from("pets")
        .upsert(
          {
            owner_id: user.id,
            name: petName,
            species,
            original_image_url: originalImageUrl ?? null,
            persona_avatar_url: personaAvatarUrl ?? null,
          },
          { onConflict: "owner_id" }
        );

      if (dbError) throw dbError;

      const profile = {
        name: petName,
        species: species as PetProfile["species"],
        age,
        personaId: resolvedPersonaId,
        personaName: resolvedPersona.name,
        personaEmoji: resolvedPersona.emoji,
        voiceId: selectedVoiceId,
        customRules,
        originalImageUrl: originalImageUrl ?? undefined,
        personaAvatarUrl: personaAvatarUrl ?? undefined,
      } satisfies Partial<PetProfile> as PetProfile;
      localStorage.setItem("pet-profile", JSON.stringify(profile));

      router.push("/personas/reveal");
    } catch (err) {
      console.error("Save error:", err);
      setError("Something went wrong saving your profile. Please try again.");
      setSaving(false);
    }
  }, [petName, species, age, resolvedPersonaId, resolvedPersona, selectedVoiceId, customRules, originalImageUrl, personaAvatarUrl, router]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg flex flex-col items-stretch">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 shadow-sm">
            <PawPrint className="h-5 w-5 text-primary" />
          </div>
          <span
            className="text-base font-bold text-foreground"
            style={{ fontFamily: "var(--font-varela, 'Varela Round', sans-serif)" }}
          >
            Pet POV AI
          </span>
        </div>

        <ProgressPill step={step} total={4} />

        {/* ── Step 1: Pet Info ──── */}
        {step === 1 && (
          <AnimatedStep stepKey="step1">
            <div className="clay-card p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Tell us about your pet
                </h1>
                <p className="text-sm text-muted-foreground">
                  We'll use this to personalize their AI voice and personality.
                </p>
              </div>

              <div className="space-y-5">

                {/* ── Premium Photo Dropzone ──── */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Add a photo{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      optional — we'll generate their AI avatar
                    </span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoSelect(f);
                    }}
                  />
                  <div
                    onClick={() => !photoUploading && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handlePhotoSelect(f);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden",
                      "border-2 border-dashed",
                      photoPreview
                        ? "h-44 border-primary/40"
                        : "h-36 border-orange-300 bg-orange-50/60 hover:bg-orange-50 hover:border-primary/50",
                      dragOver && "border-primary bg-orange-50 scale-[1.01] shadow-md",
                      photoUploading && "cursor-wait"
                    )}
                    style={{
                      boxShadow: dragOver
                        ? "0 0 0 4px rgba(249,115,22,0.15), inset 0 0 20px rgba(249,115,22,0.06)"
                        : undefined,
                    }}
                  >
                    {photoPreview ? (
                      <>
                        {/* Photo preview fill */}
                        <img
                          src={photoPreview}
                          alt="Pet photo preview"
                          className="w-full h-full object-cover"
                        />
                        {/* Status overlay */}
                        <div className="absolute inset-0 bg-black/25 flex items-end justify-center pb-3">
                          {photoUploading ? (
                            <div className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-3.5 py-1.5">
                              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                              <span className="text-[11px] text-white font-semibold">Uploading…</span>
                            </div>
                          ) : personaAvatarUrl ? (
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500/90 backdrop-blur-sm px-3.5 py-1.5 animate-fade-in-up">
                              <Sparkles className="h-3.5 w-3.5 text-white" />
                              <span className="text-[11px] text-white font-bold">✨ AI Avatar Ready!</span>
                            </div>
                          ) : originalImageUrl ? (
                            <div className="flex items-center gap-2 rounded-full bg-amber-500/80 backdrop-blur-sm px-3.5 py-1.5">
                              <Loader2 className="h-3 w-3 text-white animate-spin" />
                              <span className="text-[11px] text-white font-semibold">Generating avatar…</span>
                            </div>
                          ) : null}
                        </div>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview(null);
                            setOriginalImageUrl(null);
                            setPersonaAvatarUrl(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 border-2 border-orange-200 shadow-sm">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-sm font-semibold text-foreground">
                            {dragOver ? "Drop it here!" : "Drop a photo or click to browse"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, HEIC — your pet deserves a portrait
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold text-primary shadow-sm hover:bg-orange-50 transition-colors">
                          <Upload className="h-3 w-3" />
                          Browse photos
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Pet name */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">
                    What's their name?
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="e.g. Goofinsmirtz"
                    className="clay-input w-full px-4 py-3 text-sm"
                  />
                </div>

                {/* Species selector */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    What kind of pet?
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {SPECIES_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSpecies(value)}
                        className={cn(
                          "clay-option rounded-2xl py-3 text-sm font-semibold text-center",
                          species === value && "selected"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">
                    How old are they?{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 3 years"
                    className="clay-input w-full px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!petName || !species}
                className="clay-button w-full flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </AnimatedStep>
        )}

        {/* ── Step 2: Quiz ──── */}
        {step === 2 && (
          <AnimatedStep stepKey={`step2-q${currentQuestion}`}>
            <div className="clay-card p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">
                  Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
                </p>
                <h1 className="text-xl font-bold text-foreground leading-snug">
                  {QUIZ_QUESTIONS[currentQuestion]?.question}
                </h1>
              </div>

              <div className="space-y-3">
                {QUIZ_QUESTIONS[currentQuestion]?.options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuizAnswer(idx)}
                    className="clay-option w-full text-left px-4 py-3.5 text-sm text-foreground leading-snug"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                {currentQuestion > 0 ? (
                  <button
                    onClick={() => {
                      setCurrentQuestion((q) => q - 1);
                      setQuizAnswers((prev) => prev.slice(0, -1));
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
                </span>
              </div>
            </div>
          </AnimatedStep>
        )}

        {/* ── Step 4: Customize & Save ──── */}
        {step === 4 && resolvedPersona && (
          <AnimatedStep stepKey="step4">
            <div className="clay-card p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">
                  <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                  Your pet's persona
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Meet <span className="text-primary">{petName}</span> —
                </h1>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {resolvedPersona.emoji} {resolvedPersona.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resolvedPersona.description}
                </p>
              </div>

              {/* Persona selector cards */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 block">
                  Choose a different personality
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-0.5">
                  {PERSONAS.filter((p) => p.species.includes(species as never)).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setResolvedPersonaId(p.id);
                        setSelectedVoiceId(p.voiceId);
                      }}
                      className={cn(
                        "clay-option flex flex-col items-start gap-1 p-3 text-left",
                        resolvedPersonaId === p.id && "selected"
                      )}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="font-bold text-foreground text-xs">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.tone}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom rules */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  Anything specific to add?{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder={`e.g. "${petName} is obsessed with squirrels and hates bath time"`}
                  rows={3}
                  className="clay-input w-full px-4 py-3 text-sm resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="clay-button clay-button-cta w-full flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                ← Retake the quiz
              </button>
            </div>
          </AnimatedStep>
        )}
      </div>
    </div>
  );
}
