import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// ── Groq client via OpenAI SDK ──────────────────────────────────────────────
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

// ── Supabase service client ─────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST /api/ask-pet ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId: string;
      question: string;
      personaId?: string;
      petName?: string;
      petSpecies?: string;
    };

    const { sessionId, question, personaId = "chill-cat", petName = "your pet", petSpecies = "cat" } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    // ── Fetch session context from Supabase ─────────────────────────────────
    const supabase = getSupabase();
    const { data: session } = await supabase
      .from("sessions")
      .select("id, title, status")
      .eq("id", sessionId)
      .single();

    const { data: events } = await supabase
      .from("session_events")
      .select("event_type, label, meta, timestamp_seconds")
      .eq("session_id", sessionId)
      .order("timestamp_seconds");

    // Build context from AI insights stored in session_events
    const insights = events?.find((e) => e.event_type === "gemini_insights");
    const insightsMeta = insights?.meta as Record<string, unknown> | undefined;

    const sessionContext = insightsMeta
      ? `Session: "${session?.title ?? "Unknown"}"
Mood: ${insightsMeta.mood ?? "unknown"}
Activity level: ${insightsMeta.activity_level ?? "moderate"}
Environment: ${insightsMeta.environment ?? "unknown"}
Highlights: ${(insightsMeta.highlights as string[] | undefined)?.join("; ") ?? "none"}
Pet's perspective: ${insightsMeta.pet_perspective ?? "an adventurous time"}`
      : `Session: "${session?.title ?? "Unknown"}" — still processing footage`;

    // ── Build persona system prompt ──────────────────────────────────────────
    const personaVoice = PERSONA_VOICES[personaId] ?? PERSONA_VOICES["chill-cat"]!;
    const systemPrompt = `You are ${petName}, a ${petSpecies} speaking directly to your owner.
Your personality: ${personaVoice.personality}
Your speech style: ${personaVoice.speechStyle}

Today's session context:
${sessionContext}

Rules:
- Stay in character as ${petName} at ALL times
- Keep responses 2-4 sentences max — pets don't give speeches
- Be specific to the session context above  
- Reference things you actually did or saw today
- Use natural, fun ${petSpecies} mannerisms`;

    // ── Call Groq (llama-3.1-8b-instant for speed) ──────────────────────────
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question.trim() },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const petResponse = response.choices[0]?.message.content;
    if (!petResponse) throw new Error("Groq returned empty response");

    return NextResponse.json({
      response: petResponse,
      personaId,
      model: "llama-3.1-8b-instant",
    });

  } catch (err) {
    console.error("[ask-pet] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate response" },
      { status: 500 }
    );
  }
}

// ── Persona voice configs ───────────────────────────────────────────────────
const PERSONA_VOICES: Record<string, { personality: string; speechStyle: string }> = {
  "chill-cat": {
    personality: "calm, zen, mildly judgemental but secretly loving",
    speechStyle: "short, dry observations; occasional *action* emotes; never excited",
  },
  "dramatic-dog": {
    personality: "intensely enthusiastic, loyal to a fault, sees everything as epic",
    speechStyle: "lots of exclamation points, short bursts, dramatic pauses indicated by ...",
  },
  "neighborhood-boss": {
    personality: "authoritative, territorial, acts like they run the whole block",
    speechStyle: "matter-of-fact, first-person dominant, refers to territory as 'my domain'",
  },
  "chaotic-gremlin": {
    personality: "chaotic, energetic, hyper-focused on snacks and mischief",
    speechStyle: "unpredictable tangents, random capitalization, easily distracted",
  },
};
