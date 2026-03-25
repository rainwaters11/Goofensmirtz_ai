import Link from "next/link";
import { Video, Upload, TrendingUp } from "lucide-react";
import { SectionHeader } from "../components/section-header";
import { StatsCard } from "../components/stats-card";
import { EmptyState } from "../components/empty-state";
import { Button } from "../components/ui/button";

/**
 * Dashboard — creator overview page.
 *
 * Shows aggregate stats, recent projects, and a prominent upload CTA.
 * TODO: Replace placeholder counts with data from Supabase queries.
 * TODO: Replace empty state with VideoProjectCard grid once projects exist.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Page header ─────────────────────────────── */}
      <SectionHeader
        title="Dashboard"
        description="Overview of your Pet POV AI projects"
        action={
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              New project
            </Link>
          </Button>
        }
      />

      {/* ── Stats row ───────────────────────────────── */}
      {/* TODO: Fetch real counts from Supabase */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total projects"
          value={0}
          icon={Video}
          trend="Upload your first video to get started"
        />
        <StatsCard
          label="Processed this week"
          value={0}
          icon={TrendingUp}
        />
        <StatsCard
          label="Ready to export"
          value={0}
          icon={Video}
        />
      </div>

      {/* ── Recent projects ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Recent projects" />

        {/* TODO: Replace EmptyState with a grid of VideoProjectCard when data exists */}
        <EmptyState
          icon={Video}
          title="No projects yet"
          description="Upload your first pet video to start the AI pipeline — scene detection, narration, and voiceover included."
          action={
            <Button asChild>
              <Link href="/upload">Upload a video</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
