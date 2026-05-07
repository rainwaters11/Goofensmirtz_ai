"use client";

import { useEffect } from "react";

/**
 * Error boundary for /sessions/* routes.
 * Required by Next.js 15 App Router to prevent "missing required error
 * components" crashes when session data is unavailable.
 */
export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[sessions] Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-white">
      <div className="text-4xl">🐾</div>
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-neutral-400 max-w-sm text-center">
        {error.message ?? "Couldn't load this session. The data might still be loading."}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-400 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
