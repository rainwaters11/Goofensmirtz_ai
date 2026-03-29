"use client";

import Link from "next/link";
import { Plus, Upload, Camera } from "lucide-react";
import { MemoryFeed, type FeedSession } from "./memory-feed";
import { StickyChat } from "./sticky-chat";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pet {
  id: string;
  name: string;
  species: string;
  originalImageUrl?: string;   // real photo — shown in dashboard header
  personaAvatarUrl?: string;   // AI-generated avatar — shown in chat bubble
}

interface DashboardClientProps {
  pet: Pet;
  sessions: FeedSession[];
  userEmail: string;
}

// ── Persona emoji by species ──────────────────────────────────────────────────

const SPECIES_EMOJI: Record<string, string> = {
  dog:    "🐕",
  cat:    "🐈",
  rabbit: "🐇",
  bird:   "🐦",
  other:  "🐾",
};

// ── Pet Avatar Frame ──────────────────────────────────────────────────────────

function PetAvatarFrame({
  src,
  fallbackEmoji,
  size = 72,
  name,
}: {
  src?: string | undefined;
  fallbackEmoji: string;
  size?: number | undefined;
  name: string;
}) {
  return (
    <div
      className="pet-avatar-frame animate-avatar-glow shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100"
          style={{ fontSize: size * 0.42 }}
        >
          {fallbackEmoji}
        </div>
      )}
    </div>
  );
}

// ── Quick Stat Card ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  emoji,
  delay = 0,
}: {
  value: string | number;
  label: string;
  emoji: string;
  delay?: number;
}) {
  return (
    <div
      className="clay-card p-4 flex flex-col items-center justify-center text-center gap-1 min-h-[100px]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-2xl mb-0.5">{emoji}</span>
      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-varela, 'Varela Round', sans-serif)" }}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardClient({ pet, sessions, userEmail: _userEmail }: DashboardClientProps) {
  const petEmoji = SPECIES_EMOJI[pet.species] ?? "🐾";
  const latestSession = sessions[0];
  const [chatOpen, setChatOpen] = useState(false);
  const completedSessions = sessions.filter(
    (s) => s.status === "complete" || s.status === "rendered" || s.status === "narrated"
  ).length;

  return (
    <div className="relative flex flex-col gap-6 pb-28">

      {/* ── Premium Header Strip ─────────────────────────── */}
      <div
        className="clay-card flex items-center justify-between px-5 py-4 bento-card-1"
        style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)" }}
      >
        <div className="flex items-center gap-4">
          <PetAvatarFrame
            src={pet.originalImageUrl}
            fallbackEmoji={petEmoji}
            size={64}
            name={pet.name}
          />
          <div>
            <p
              className="text-xl font-bold text-foreground leading-tight"
              style={{ fontFamily: "var(--font-varela, 'Varela Round', sans-serif)" }}
            >
              {pet.name}&apos;s World
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              {pet.species} · {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Link
          href="/upload"
          className="clay-button flex items-center gap-1.5 px-4 py-2.5 text-sm"
        >
          <Upload className="h-4 w-4" />
          New session
        </Link>
      </div>

      {/* ── Bento Grid ───────────────────────────────────── */}
      <div className="bento-grid">

        {/* Sessions count */}
        <div className="bento-card-2">
          <StatCard
            value={sessions.length}
            label="Total sessions"
            emoji="🎬"
          />
        </div>

        {/* Completed stories */}
        <div className="bento-card-3">
          <StatCard
            value={completedSessions}
            label="Stories ready"
            emoji="✨"
            delay={80}
          />
        </div>

        {/* Quick upload tile */}
        <Link
          href="/upload"
          className="clay-card p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[100px] group bento-card-4 cursor-pointer"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs font-bold text-primary">Upload clip</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Add {pet.name}&apos;s latest adventure</p>
        </Link>
      </div>

      {/* ── Main Layout — Memory Feed + Desktop Chat ──────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT — Memory Feed */}
        <div className="flex-1 min-w-0">
          <MemoryFeed sessions={sessions} petName={pet.name} />
        </div>

        {/* RIGHT — Desktop sticky chat panel */}
        {latestSession && (
          <div className="hidden lg:block lg:w-80 xl:w-96 lg:sticky lg:top-6">
            <div className="clay-card overflow-hidden p-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/40">
                {pet.personaAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.personaAvatarUrl}
                    alt={pet.name}
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-lg border-2 border-orange-200">
                    {petEmoji}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Ask {pet.name}</p>
                  <p className="text-[10px] text-muted-foreground">AI · always on</p>
                </div>
                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  LIVE
                </span>
              </div>

              {/* Chat body */}
              <DesktopChat
                petName={pet.name}
                petEmoji={petEmoji}
                petId={pet.id}
                latestSessionId={latestSession.id}
                personaAvatarUrl={pet.personaAvatarUrl}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile FAB cluster ───────────────────────────── */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end gap-3 lg:hidden z-50">
        {/* Upload FAB */}
        <Link
          href="/upload"
          className="clay-button flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl"
          aria-label="Upload new session"
          style={{ borderRadius: "9999px", padding: 0, boxShadow: "6px 6px 20px rgba(249,115,22,0.3), -2px -2px 8px rgba(255,255,255,0.8)" }}
        >
          <Plus className="h-6 w-6" />
        </Link>

        {/* Chat FAB */}
        {latestSession && (
          <StickyChat
            petId={pet.id}
            petName={pet.name}
            petEmoji={petEmoji}
            latestSessionId={latestSession.id}
            personaAvatarUrl={pet.personaAvatarUrl}
          />
        )}
      </div>
    </div>
  );
}

// ── DesktopChat ───────────────────────────────────────────────────────────────

import { useRef, useCallback } from "react";
import { Send, Sparkles, Volume2, X } from "lucide-react";
import { askPet } from "../../lib/api";
import { cn } from "../../lib/utils";

interface Turn {
  question: string;
  response: string;
  personaName: string;
}

const STARTERS = [
  "How was your day?",
  "What scared you today?",
  "Tell me about your favourite spot.",
];

function DesktopChat({
  petName,
  petEmoji,
  latestSessionId,
  personaAvatarUrl,
}: {
  petName: string;
  petEmoji: string;
  petId: string;
  latestSessionId: string;
  personaAvatarUrl?: string | undefined;
}) {
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
  }, []);

  const handleSend = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isLoading) return;
      setInput("");
      setError(null);
      setIsLoading(true);
      setConversation((prev) => [...prev, { question: trimmed, response: "", personaName: "" }]);
      scrollToBottom();
      try {
        const result = await askPet(latestSessionId, trimmed);
        setConversation((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { question: trimmed, response: result.response, personaName: result.personaName };
          return updated;
        });
        scrollToBottom();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setConversation((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, latestSessionId, scrollToBottom]
  );

  return (
    <div className="flex flex-col">
      {/* Conversation */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto p-4"
        style={{ maxHeight: "380px", minHeight: "200px", background: "rgba(255,247,237,0.5)" }}
      >
        {conversation.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="text-4xl">{petEmoji}</div>
            <div>
              <p className="text-sm font-bold text-foreground">Ready to chat, human.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ask me anything about my day.</p>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="clay-option rounded-xl py-2 text-[11px] font-semibold text-primary text-left px-3"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((turn, i) => (
          <div key={i} className="flex flex-col gap-2.5 animate-fade-in-up">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2" style={{ background: "hsl(24 95% 53%)" }}>
                <p className="text-xs font-semibold text-white">{turn.question}</p>
              </div>
            </div>
            {/* Pet response bubble */}
            {turn.response && (
              <div className="flex items-end gap-2">
                {personaAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={personaAvatarUrl}
                    alt={petName}
                    className="h-7 w-7 shrink-0 rounded-full object-cover border-2 border-orange-200"
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-200 text-sm">
                    {petEmoji}
                  </div>
                )}
                <div className="clay-card max-w-[80%] px-3.5 py-2" style={{ borderRadius: "16px 16px 16px 4px" }}>
                  <p className="text-xs leading-relaxed text-foreground">{turn.response}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-muted-foreground">— {petName}</p>
                    <button
                      onClick={() => {
                        if (window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                          const u = new SpeechSynthesisUtterance(turn.response);
                          window.speechSynthesis.speak(u);
                        }
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-2 animate-fade-in-up">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-200 text-sm">
              {petEmoji}
            </div>
            <div className="clay-card px-4 py-2.5" style={{ borderRadius: "16px 16px 16px 4px" }}>
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-3 py-1.5">
          <p className="text-[11px] text-red-700">{error}</p>
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5 text-red-500" /></button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-orange-100 px-3 py-2.5 bg-white/60">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            placeholder={`Ask ${petName}…`}
            disabled={isLoading}
            className="clay-input w-full px-3.5 py-2 pr-8 text-xs"
          />
          {input.trim() && !isLoading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </div>
          )}
        </div>
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          className={cn(
            "clay-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          )}
          style={{ padding: 0 }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
