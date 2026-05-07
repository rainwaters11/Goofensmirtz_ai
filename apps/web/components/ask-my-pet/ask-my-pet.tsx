"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Sparkles, Volume2 } from "lucide-react";
import { askPet } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationTurn {
  question: string;
  response: string;
  personaName: string;
}

interface AskMyPetProps {
  sessionId: string;
  petName: string;
  personaName: string;
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  { label: "What was the best part of your day?", icon: "⭐" },
  { label: "Tell me about that trampoline", icon: "🪤" },
  { label: "Who was that other cat you met?", icon: "🐈" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AskMyPet({ sessionId, petName, personaName }: AskMyPetProps) {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSend = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isLoading) return;

      setInput("");
      setError(null);
      setIsLoading(true);

      // Optimistically add the user's question
      const placeholder: ConversationTurn = {
        question: trimmed,
        response: "",
        personaName: "",
      };
      setConversation((prev) => [...prev, placeholder]);
      scrollToBottom();

      try {
        const result = await askPet(sessionId, trimmed);
        setConversation((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            question: trimmed,
            response: result.response,
            personaName: result.personaName,
          };
          return updated;
        });
        scrollToBottom();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        // Remove the placeholder on error
        setConversation((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, sessionId, scrollToBottom]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
      }
    },
    [input, handleSend]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Conversation area */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4 max-h-[420px] overflow-y-auto min-h-[120px]"
      >
        {conversation.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl mb-3">
              🐾
            </div>
            <p className="text-sm font-medium text-foreground">
              Ask {petName} anything about their day
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try one of the suggestions below, or type your own question
            </p>
          </div>
        )}

        {conversation.map((turn, i) => (
          <div key={i} className="flex flex-col gap-3 animate-fade-in-up">
            {/* User question — right aligned */}
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5">
                <p className="text-sm font-medium text-white">
                  {turn.question}
                </p>
              </div>
            </div>

            {/* Pet response — left aligned */}
            {turn.response ? (
              <div className="flex items-end gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-base"
                  aria-label={petName}
                >
                  🐾
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white border border-border px-4 py-2.5 shadow-sm">
                  <p className="text-sm leading-relaxed text-foreground">
                    {turn.response}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      — {petName}, via {turn.personaName}
                    </p>
                    <button
                      onClick={() => speakResponse(turn.response)}
                      className="ml-2 rounded-full p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                      aria-label="Listen to response"
                      title="Listen to response"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2 animate-fade-in-up">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-base">
              🐾
            </div>
            <div className="rounded-2xl rounded-bl-md bg-white border border-border px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Suggested prompt chips */}
      {conversation.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.label)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-sm font-medium text-violet-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-100 hover:shadow-sm active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${petName} something…`}
            disabled={isLoading}
            className="w-full rounded-xl border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
            aria-label={`Ask ${petName} a question`}
          />
          {input.trim() && !isLoading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
            </div>
          )}
        </div>
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition-all duration-200 hover:bg-violet-700 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-600 disabled:hover:shadow-sm cursor-pointer"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
