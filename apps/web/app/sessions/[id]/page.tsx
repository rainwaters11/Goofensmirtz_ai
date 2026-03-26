import Link from "next/link";
import {
  ArrowLeft,
  Film,
  FileText,
  Mic,
  Download,
  Play,
  MessageSquare,
} from "lucide-react";
import { SectionHeader } from "../../../components/section-header";
import { ProcessingStatusCard } from "../../../components/projects/processing-status-card";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

/**
 * SessionDetailPage — detail view for a single pet camera session.
 *
 * Sections:
 * - Video preview placeholder (Experience Recap)
 * - Pipeline progress tracker
 * - Session events / timeline placeholder
 * - Narration script placeholder
 * - Voiceover placeholder
 * - Ask My Pet panel placeholder
 * - Export / render section placeholder
 *
 * TODO: Fetch real session data from GET /api/sessions/:id
 * TODO: Stream live job updates via Supabase realtime or polling
 */
export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: Replace with real data fetch from sessions table
  const session = {
    id,
    title: "Biscuit's Wild Tuesday",
    status: "processing" as const,
    createdAt: new Date().toISOString(),
  };

  // TODO: Replace with live pipeline steps fetched from pipeline_jobs
  const PIPELINE_STEPS = [
    { label: "Upload to Cloudinary", status: "complete" as const },
    { label: "Extract scenes (FFmpeg)", status: "complete" as const },
    { label: "Generate events (Gemini Vision)", status: "running" as const },
    { label: "Convert events to TOON", status: "pending" as const },
    { label: "Generate narration script (GPT-4o)", status: "pending" as const },
    { label: "Generate voiceover (TTS)", status: "pending" as const },
    { label: "Render final video (FFmpeg / Remotion)", status: "pending" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Back + header ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/sessions"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </Link>

        <SectionHeader
          title={session.title}
          description={`Session ID: ${session.id}`}
          action={<Badge variant="processing">Processing</Badge>}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: main content ────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Video preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Film className="h-4 w-4" />
                Session footage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                {/* TODO: Replace with Cloudinary video player once rendered */}
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Play className="h-10 w-10" strokeWidth={1.5} />
                  <p className="text-sm">Preview available after render completes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session events / timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session events</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Render SessionEvent[] timeline cards here */}
              <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Session events will appear here after Gemini Vision analysis completes.
              </div>
            </CardContent>
          </Card>

          {/* Narration script */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Narration script
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Display generated narration script with persona name */}
              <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                The narration script will appear here after GPT-4o generation.
              </div>
            </CardContent>
          </Card>

          {/* Voiceover */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="h-4 w-4" />
                Voiceover
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Add audio player with generated voice_url from narrations table */}
              <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                The voiceover audio will appear here after TTS synthesis.
              </div>
            </CardContent>
          </Card>

          {/* Ask My Pet panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Ask My Pet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Ask your pet questions about this session. The AI will generate a
                simulated response based on what happened — using the session events
                and your pet&apos;s persona.
              </p>
              {/* TODO: Build conversational UI — text input + response display */}
              {/* TODO: Wire to POST /api/ask with sessionId + personaId */}
              <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Ask My Pet becomes available after session events are extracted.
              </div>
              {/* TODO: Display ConversationTurn[] history here */}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: pipeline + export ──────────── */}
        <div className="flex flex-col gap-6">
          <ProcessingStatusCard steps={PIPELINE_STEPS} />

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-4 w-4" />
                Export
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Export options become available once the pipeline is complete.
              </p>
              {/* TODO: Wire export to POST /api/render with sessionId */}
              <Button variant="outline" disabled>
                Download recap video
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
