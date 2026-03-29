"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SessionRealtimeListenerProps {
  sessionId: string;
  /** Called when the status transitions to 'complete' — for UI flourish */
  onComplete?: () => void;
}

/**
 * SessionRealtimeListener
 *
 * Thin Client Component — no visible UI until the status flips.
 *
 * Architecture rationale:
 *   Subscribes to Postgres realtime changes on the sessions table,
 *   filtered to this specific sessionId.  When the background worker
 *   marks the session as 'complete', this fires router.refresh() which
 *   instructs Next.js to silently re-fetch the Server Component tree
 *   and merge the new data into the DOM — zero hard reload.
 *
 *   The toast flourish is rendered here (client-side) so it can appear
 *   during the brief re-render window, then auto-dismiss.
 */
export function SessionRealtimeListener({
  sessionId,
  onComplete,
}: SessionRealtimeListenerProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const channelRef = useRef<ReturnType<typeof createClient>["channel"] | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`session-status-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string }).status;

          if (newStatus === "complete" || newStatus === "narrated" || newStatus === "complete") {
            // Flash the "Story Ready" toast
            setShowToast(true);
            onComplete?.();

            // Give the toast 1 second of visibility, then refresh
            setTimeout(() => {
              router.refresh();
            }, 1000);

            // Auto-dismiss the toast after the refresh lands
            setTimeout(() => {
              setShowToast(false);
            }, 3500);
          } else {
            // For intermediate statuses (processing → events_extracted → narrated)
            // silently refresh so the pipeline progress card updates
            router.refresh();
          }
        }
      )
      .subscribe();

    // Store ref so we can clean up
    channelRef.current = channel as unknown as ReturnType<typeof createClient>["channel"];

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, router, onComplete]);

  // ── Toast notification ────────────────────────────────────────────
  if (!showToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in-up"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 shadow-xl shadow-emerald-500/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Story Ready!
          </span>
          <span className="text-xs text-muted-foreground">
            Loading your pet&apos;s perspective…
          </span>
        </div>
      </div>
    </div>
  );
}
