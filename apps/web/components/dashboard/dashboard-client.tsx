"use client";

import Link from "next/link";
import { Plus, PawPrint, Upload } from "lucide-react";
import { MemoryFeed, type FeedSession } from "./memory-feed";
import { StickyChat } from "./sticky-chat";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pet {
  id: string;
  name: string;
  species: string;
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

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardClient({ pet, sessions, userEmail }: DashboardClientProps) {
  const petEmoji = SPECIES_EMOJI[pet.species] ?? "🐾";
  const latestSession = sessions[0];
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative flex flex-col gap-6 pb-24">

      {/* ── Pet header strip ─────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl border bg-gradient-to-r from-orange-50 via-amber-50/40 to-white px-6 py-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
            {petEmoji}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{pet.name}&apos;s Dashboard</p>
            <p className="text-xs text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
              <span className="capitalize">{pet.species}</span>
            </p>
          </div>
        </div>

        <Link
          href="/upload"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Upload className="h-4 w-4" />
          New session
        </Link>
      </div>

      {/* ── Main layout ──────────────────────────────────── */}
      {/*
        Desktop: two-column split
          Left ~60%: Memory Feed
          Right ~40%: Sticky "Ask [Pet]" chat panel (always visible)
        Mobile: single column, chat collapses to FAB
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT — Memory Feed */}
        <div className="flex-1 min-w-0">
          <MemoryFeed sessions={sessions} petName={pet.name} />
        </div>

        {/* RIGHT — Desktop sticky chat */}
        {latestSession && (
          <div className="hidden lg:block lg:w-80 xl:w-96 lg:sticky lg:top-6">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-base">
                  {petEmoji}
                </div>
                <h2 className="text-sm font-bold text-foreground">Ask {pet.name}</h2>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  AI · always on
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-9">
                Chat from {pet.name}&apos;s perspective, anytime.
              </p>
            </div>

            {/* Always-expanded on desktop */}
            <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
              {/* Inline StickyChat — always open on desktop */}
              <DesktopChat
                petName={pet.name}
                petEmoji={petEmoji}
                petId={pet.id}
                latestSessionId={latestSession.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: floating FAB cluster ─────────────────── */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end gap-3 lg:hidden z-50">
        {/* Upload FAB */}
        <Link
          href="/upload"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-white hover:bg-primary/90 hover:scale-110 transition-all"
          aria-label="Upload new session"
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
          />
        )}
      </div>
    </div>
  );
}

// ── DesktopChat — same logic as StickyChat but always expanded on desktop ─────

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
}: {
  petName: string;
  petEmoji: string;
  petId: string;
  latestSessionId: string;
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
        className="flex flex-col gap-3 overflow-y-auto bg-muted/20 p-4"
        style={{ maxHeight: "400px", minHeight: "200px" }}
      >
        {conversation.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-4xl">{petEmoji}</div>
            <div>
              <p className="text-sm font-medium text-foreground">Ready to chat, human.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ask me anything about my day.</p>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-xl border border-violet-200 bg-violet-50 py-2 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors text-left px-3"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((turn, i) => (
          <div key={i} className="flex flex-col gap-2.5 animate-fade-in-up">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2">
                <p className="text-xs font-medium text-white">{turn.question}</p>
              </div>
            </div>
            {turn.response && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-sm">
                  {petEmoji}
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white border border-border px-3.5 py-2 shadow-sm">
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-sm">
              {petEmoji}
            </div>
            <div className="rounded-2xl rounded-bl-md bg-white border border-border px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
          <p className="text-[11px] text-red-700">{error}</p>
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5 text-red-500" /></button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t px-3 py-2.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            placeholder={`Ask ${petName}…`}
            disabled={isLoading}
            className="w-full rounded-xl border bg-background px-3.5 py-2 pr-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 disabled:opacity-50 transition-all"
          />
          {input.trim() && !isLoading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
            </div>
          )}
        </div>
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm transition-all",
            "hover:bg-violet-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
