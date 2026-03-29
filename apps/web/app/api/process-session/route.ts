import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const maxDuration = 300;

// ── Supabase service client ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getServiceClient(): SupabaseClient<any, "public", any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
// Use gemini-2.5-flash — confirmed available via ListModels for this key
const MODEL_NAME = "gemini-2.5-flash";
// Inline limit: use File API for videos larger than this
const INLINE_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB

// ── POST /api/process-session ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let sessionId: string | undefined;

  try {
    const body = await req.json() as { sessionId?: string; videoUrl?: string; petId?: string };
    sessionId = body.sessionId;
    const videoUrl = body.videoUrl;

    if (!sessionId || !videoUrl) {
      return NextResponse.json({ error: "sessionId and videoUrl required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    const supabase = getServiceClient();
    console.log(`[process-session] Starting: ${sessionId}`);

    // ── Download video ─────────────────────────────────────────────────────────
    let videoBytes: Buffer;
    const videoRes = await fetch(videoUrl);

    if (!videoRes.ok) {
      // Try signed URL fallback for private buckets
      const storagePath = videoUrl.split("/storage/v1/object/public/videos/")[1] ?? "";
      const { data: signedData } = await supabase.storage
        .from("videos")
        .createSignedUrl(storagePath, 600);

      if (!signedData?.signedUrl) {
        throw new Error(`Cannot access video: HTTP ${videoRes.status}`);
      }
      const retry = await fetch(signedData.signedUrl);
      if (!retry.ok) throw new Error(`Video download failed: ${retry.status}`);
      videoBytes = Buffer.from(await retry.arrayBuffer());
    } else {
      videoBytes = Buffer.from(await videoRes.arrayBuffer());
    }

    const sizeMB = (videoBytes.length / 1024 / 1024).toFixed(1);
    console.log(`[process-session] Downloaded ${sizeMB}MB`);

    const mimeType = detectVideoMime(videoBytes);

    // ── Send to Gemini ─────────────────────────────────────────────────────────
    let insights: Record<string, unknown>;

    if (videoBytes.length > INLINE_SIZE_LIMIT) {
      // Large video → use File API
      insights = await analyzeViaFileApi(videoBytes, mimeType);
    } else {
      // Small video → inline base64
      insights = await analyzeInline(videoBytes, mimeType);
    }

    console.log(`[process-session] Gemini insights:`, JSON.stringify(insights).slice(0, 200));

    // ── Build session title ────────────────────────────────────────────────────
    const mood = typeof insights["mood"] === "string" ? insights["mood"] : "active";
    const env = typeof insights["environment"] === "string" ? insights["environment"] : "session";
    const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const sessionTitle = `${dateLabel} — ${mood} ${env} session`;
    const durationSeconds = typeof insights["duration_seconds"] === "number"
      ? insights["duration_seconds"]
      : null;

    // ── Update session ─────────────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        status: "complete",
        title: sessionTitle,
        duration_seconds: durationSeconds,
        modes_run: ["gemini_vision"],
      } as Record<string, unknown>)
      .eq("id", sessionId);

    if (updateError) throw new Error(`Session update failed: ${updateError.message}`);

    // ── Store insights as event ────────────────────────────────────────────────
    await supabase.from("session_events").upsert({
      session_id: sessionId,
      event_type: "gemini_insights",
      timestamp_seconds: 0,
      label: "AI Analysis Complete",
      confidence: 0.95,
      meta: insights,
    } as Record<string, unknown>);

    console.log(`[process-session] ✅ Complete: ${sessionId} (${mood})`);
    return NextResponse.json({ success: true, sessionId, mood, sessionTitle });

  } catch (err) {
    console.error("[process-session] Error:", err);

    if (sessionId) {
      try {
        await getServiceClient()
          .from("sessions")
          .update({ status: "error" } as Record<string, unknown>)
          .eq("id", sessionId);
      } catch { /* best effort */ }
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}

// ── Gemini via File API (for videos > 4MB) ─────────────────────────────────────
async function analyzeViaFileApi(
  videoBytes: Buffer,
  mimeType: string
): Promise<Record<string, unknown>> {
  // 1. Upload to Gemini Files API
  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Command": "start, upload, finalize",
        "X-Goog-Upload-Header-Content-Length": String(videoBytes.length),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": mimeType,
      },
      // Convert Buffer to Uint8Array for fetch compatibility
      body: new Uint8Array(videoBytes),
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gemini file upload failed: ${uploadRes.status} ${errText.slice(0, 200)}`);
  }

  const uploadData = await uploadRes.json() as { file?: { uri?: string; name?: string; state?: string } };
  const fileUri = uploadData?.file?.uri;
  if (!fileUri) throw new Error("Gemini file upload returned no URI");

  console.log(`[process-session] File uploaded to Gemini: ${fileUri}`);

  // 2. Poll until file is ACTIVE (usually instant for short videos, a few seconds for long ones)
  await waitForFileActive(uploadData?.file?.name ?? "");

  // 3. Generate content referencing the uploaded file
  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { fileData: { mimeType, fileUri } },
            { text: ANALYSIS_PROMPT },
          ],
        }],
      }),
    }
  );

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(`Gemini generateContent failed: ${genRes.status} ${errText.slice(0, 200)}`);
  }

  const genData = await genRes.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = genData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseInsights(rawText);
}

// ── Gemini inline (for videos < 4MB) ──────────────────────────────────────────
async function analyzeInline(
  videoBytes: Buffer,
  mimeType: string
): Promise<Record<string, unknown>> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType, data: videoBytes.toString("base64") } },
        { text: ANALYSIS_PROMPT },
      ],
    }],
  });

  return parseInsights(result.response.text());
}

// ── Poll Gemini file state until ACTIVE ────────────────────────────────────────
async function waitForFileActive(fileName: string): Promise<void> {
  if (!fileName) return;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`
    );
    if (!res.ok) return;
    const data = await res.json() as { state?: string };
    if (data.state === "ACTIVE") {
      console.log("[process-session] File ACTIVE after", (i + 1) * 2, "s");
      return;
    }
  }
  // Give up polling after 40s — try anyway
}

// ── Shared prompt ──────────────────────────────────────────────────────────────
const ANALYSIS_PROMPT = `You are analyzing a video from a pet's point of view.
Return ONLY valid JSON (no markdown, no explanation) with this exact structure:

{
  "duration_seconds": <estimated number>,
  "mood": "<calm|playful|curious|anxious|alert|relaxed>",
  "activity_level": "<low|moderate|high>",
  "environment": "<indoor|outdoor|mixed>",
  "highlights": ["<observation 1>", "<observation 2>", "<observation 3>"],
  "pet_perspective": "<2-3 sentence first-person narrative from the pet's POV>",
  "safety_notes": [],
  "key_moments": [
    { "timestamp": <seconds>, "description": "<what pet is doing>" }
  ]
}`;

// ── Parse raw Gemini text to JSON ──────────────────────────────────────────────
function parseInsights(rawText: string): Record<string, unknown> {
  const cleaned = rawText.trim().replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    console.warn("[process-session] JSON parse failed, raw:", cleaned.slice(0, 100));
    return { raw: rawText, mood: "active", environment: "session" };
  }
}

// ── MIME type detection from magic bytes ───────────────────────────────────────
function detectVideoMime(bytes: Buffer): string {
  if (bytes[0] === 0x1a && bytes[1] === 0x45) return "video/webm";
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "video/mp4";
  if (bytes[4] === 0x6d && bytes[5] === 0x6f && bytes[6] === 0x6f && bytes[7] === 0x76) return "video/quicktime";
  return "video/mp4";
}
