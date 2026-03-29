"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Sparkles, Volume2, MessageCircle, X, ChevronDown } from "lucide-react";
import { askPet } from "../../lib/api";
import { cn } from "../../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Turn {
  question: string;
  response: string;
  personaName: string;
}

interface StickyChatProps {
  petId: string;
  petName: string;
  petEmoji?: string;
  /** Last session ID to use as context for "Ask My Pet" */
  latestSessionId: string;
  /** AI-generated stylized avatar URL — shown in chat bubbles */
  personaAvatarUrl?: string | undefined;
}

// ── Suggested starters ────────────────────────────────────────────────────────

const STARTERS = [
  "How was your day?",
  "What's on your mind?",
  "Did anything scare you today?",
  "What's your favourite spot right now?",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function StickyChat({ petName, petEmoji = "🐾", latestSessionId, personaAvatarUrl }: StickyChatProps) {
  const [open, setOpen] = useState(false);
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

      const placeholder: Turn = { question: trimmed, response: "", personaName: "" };
      setConversation((prev) => [...prev, placeholder]);
      scrollToBottom();

      try {
        const result = await askPet(latestSessionId, trimmed);
        setConversation((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            updated[updated.length - 1] = {
              question: trimmed,
              response: result.response,
              personaName: result.personaName,
            };
          }
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

  function speakResponse(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  }

  // ── Collapsed FAB ──────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 rounded-2xl bg-violet-600 px-5 py-3 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-200 active:scale-95"
        aria-label={`Chat with ${petName}`}
      >
        <span className="text-lg">{petEmoji}</span>
        <span className="text-sm font-semibold">Ask {petName}</span>
        <MessageCircle className="h-4 w-4 opacity-80" />
        {conversation.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-violet-700">
            {conversation.length}
          </span>
        )}
      </button>
    );
  }

  // ── Expanded Panel ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 rounded-2xl border bg-card shadow-lift overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 bg-violet-600">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-base">
          {petEmoji}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Ask {petName}</p>
          <p className="text-[10px] text-white/70">First-person AI from latest session</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Collapse chat"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Conversation area */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto bg-muted/20 p-4"
        style={{ maxHeight: "320px", minHeight: "160px" }}
      >
        {conversation.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <div className="text-4xl">{petEmoji}</div>
            <div>
              <p className="text-sm font-medium text-foreground">What&apos;s up, human?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ask me anything about my day.</p>
            </div>
            {/* Starters */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"
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
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2">
                <p className="text-xs font-medium text-white">{turn.question}</p>
              </div>
            </div>

            {/* Pet bubble */}
            {turn.response ? (
              <div className="flex items-end gap-2">
                {personaAvatarUrl ? (
                  <img
                    src={personaAvatarUrl}
                    alt={petName}
                    className="h-7 w-7 shrink-0 rounded-full object-cover border border-amber-200"
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-sm">
                    {petEmoji}
                  </div>
                )}
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white border border-border px-3.5 py-2 shadow-sm">
                  <p className="text-xs leading-relaxed text-foreground">{turn.response}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-muted-foreground">— {petName} via {turn.personaName}</p>
                    <button
                      onClick={() => speakResponse(turn.response)}
                      className="rounded-full p-0.5 text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Read aloud"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : isLoading && i === conversation.length - 1 ? null : null}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2 animate-fade-in-up">
            {personaAvatarUrl ? (
              <img
                src={personaAvatarUrl}
                alt={petName}
                className="h-7 w-7 shrink-0 rounded-full object-cover border border-amber-200"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-sm">
                {petEmoji}
              </div>
            )}
            <div className="rounded-2xl rounded-bl-md bg-white border border-border px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
          <p className="text-[11px] text-red-700">{error}</p>
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5 text-red-500" /></button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 border-t px-3 py-2.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder={`Ask ${petName}…`}
            disabled={isLoading}
            className="w-full rounded-xl border bg-background px-3.5 py-2 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 disabled:opacity-50 transition-all"
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
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-all",
            "bg-violet-600 hover:bg-violet-700 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
