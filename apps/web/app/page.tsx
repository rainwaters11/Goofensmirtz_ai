import Link from "next/link";
import { Video, Upload, TrendingUp, MessageSquare } from "lucide-react";
import { SectionHeader } from "../components/section-header";
import { StatsCard } from "../components/stats-card";
import { EmptyState } from "../components/empty-state";
import { Button } from "../components/ui/button";

/**
 * Dashboard — creator overview for Pet POV AI.
 *
 * Shows aggregate stats, recent sessions, and CTAs for both modes:
 * - Experience Recap (upload + pipeline)
 * - Ask My Pet (conversational Q&A)
 *
 * TODO: Replace placeholder counts with real data from Supabase queries.
 * TODO: Replace empty state with SessionCard grid once sessions exist.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Page header ─────────────────────────────── */}
      <SectionHeader
        title="Dashboard"
        description="Your pet perspective studio"
        action={
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              New session
            </Link>
          </Button>
        }
      />

      {/* ── Stats row ───────────────────────────────── */}
      {/* TODO: Fetch real counts from Supabase — sessions, conversations */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total sessions"
          value={0}
          icon={Video}
          trend="Upload your first pet camera session to get started"
        />
        <StatsCard
          label="Recap videos generated"
          value={0}
          icon={TrendingUp}
        />
        <StatsCard
          label="Ask My Pet conversations"
          value={0}
          icon={MessageSquare}
        />
      </div>

      {/* ── Recent sessions ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Recent sessions"
          action={
            <Link
              href="/sessions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          }
        />

        {/* TODO: Replace EmptyState with a grid of SessionCard when data exists */}
        <EmptyState
          icon={Video}
          title="No sessions yet"
          description="Upload a pet camera session to start generating recap videos or to ask your pet about their day."
          action={
            <Button asChild>
              <Link href="/upload">Upload a session</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
