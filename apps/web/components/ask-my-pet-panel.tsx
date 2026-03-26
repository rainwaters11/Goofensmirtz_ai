"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Send, Loader2, MessageSquare, Sparkles, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { askPet } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "pet";
  content: string;
  personaName?: string;
}

interface AskMyPetPanelProps {
  sessionId: string;
  petName: string;
  personaName: string;
  personaId: string;
}

// ─── Prompt chips ─────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { label: "What was the best part of your day?", icon: "⭐" },
  { label: "Why did you bark at the mail carrier?", icon: "📬" },
  { label: "Tell me about that plant", icon: "🪴" },
];

// ─── Voice helper ─────────────────────────────────────────────────────────────

function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AskMyPetPanel({
  sessionId,
  petName,
  personaName,
  personaId,
}: AskMyPetPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Clear chat when persona changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [personaId]);

  async function handleSubmit(e?: FormEvent, overrideMessage?: string) {
    e?.preventDefault();
    const question = overrideMessage ?? input.trim();
    if (!question || isLoading) return;

    setError(null);
    setInput("");

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await askPet(sessionId, question, personaId);

      const petMsg: ChatMessage = {
        id: `pet-${Date.now()}`,
        role: "pet",
        content: data.response,
        personaName: data.personaName ?? personaName,
      };
      setMessages((prev) => [...prev, petMsg]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get a response"
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleChipClick(prompt: string) {
    if (isLoading) return;
    setInput(prompt);
    handleSubmit(undefined, prompt);
  }

  const hasMessages = messages.length > 0;

  return (
    <Card id="ask-my-pet-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <MessageSquare className="h-4 w-4 text-violet-600" />
          Ask My Pet
        </CardTitle>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ask {petName} anything about their day. The AI generates a simulated
          response based on session events and their persona.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* ── Chat thread ──────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className={`flex flex-col gap-3 rounded-xl bg-muted/30 p-4 transition-all duration-300 ${
            hasMessages ? "max-h-[420px] overflow-y-auto" : ""
          }`}
        >
          {!hasMessages && !isLoading && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 border border-violet-200">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Ask {petName} about their day — try a suggestion below or type
                your own question!
              </p>
            </div>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end animate-fade-in-up">
                <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5">
                  <p className="text-sm font-medium text-white">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-end gap-2 animate-fade-in-up">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-base"
                  aria-label={petName}
                >
                  🐾
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white border border-border px-4 py-2.5 shadow-sm">
                  <p className="text-sm leading-relaxed text-foreground">
                    {msg.content}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      — {petName}, via {msg.personaName}
                    </p>
                    <button
                      onClick={() => speakText(msg.content)}
                      className="ml-2 rounded-full p-1 text-muted-foreground hover:text-violet-600 hover:bg-violet-50 transition-colors duration-200"
                      aria-label="Listen to response"
                      title="Listen to response"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-end gap-2 animate-fade-in-up">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-base">
                🐾
              </div>
              <div className="rounded-2xl rounded-bl-md bg-white border border-border px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full bg-violet-400/60 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-violet-400/60 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-violet-400/60 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Error message ─────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* ── Prompt chips ─────────────────────────────────────── */}
        {!hasMessages && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.label)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-sm font-medium text-violet-700 transition-all duration-200 hover:bg-violet-100 hover:border-violet-300 hover:shadow-sm active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Input area ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${petName} something…`}
              disabled={isLoading}
              className="w-full rounded-xl border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              aria-label={`Ask ${petName} a question`}
              id="ask-my-pet-input"
            />
            {input.trim() && !isLoading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
              </div>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-10 w-10 bg-violet-600 hover:bg-violet-700 text-white"
            aria-label="Send question"
            id="ask-my-pet-send"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Responses are AI-generated character simulation — not real animal
          translation.
        </p>
      </CardContent>
    </Card>
  );
}
