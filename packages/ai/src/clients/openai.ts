import OpenAI from "openai";

// ── Groq client (separate instance, OpenAI-compatible API) ─────────────────────
let _groqClient: OpenAI | null = null;

/**
 * Returns a singleton Groq client using the OpenAI SDK.
 * Groq is OpenAI-API-compatible — just swap baseURL + apiKey.
 */
export function getGroqClient(): OpenAI {
  if (_groqClient) return _groqClient;

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing required environment variable: GROQ_API_KEY");
  }

  _groqClient = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  return _groqClient;
}

/**
 * Generate a fast chat completion using Groq (Llama 3).
 *
 * Models:
 *   - "llama3-8b-8192"  → fastest, great for persona chat (Ask My Pet)
 *   - "llama3-70b-8192" → more capable, better for story/narration generation
 *
 * Falls back to best effort if GROQ_API_KEY is missing.
 */
export async function generateGroqCompletion(
  systemPrompt: string,
  userMessage: string,
  model: "llama-3.1-8b-instant" | "llama-3.3-70b-versatile" = "llama-3.1-8b-instant",
  timeoutMs = 30_000
): Promise<string> {
  const client = getGroqClient();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 1024,
      },
      { signal: controller.signal }
    );

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("Groq returned empty response");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

// ── Legacy OpenAI client (kept for TTS — audio.speech.create is not on Groq) ──
let _openAIClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (_openAIClient) return _openAIClient;
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("Missing required environment variable: OPENAI_API_KEY");
  _openAIClient = new OpenAI({ apiKey });
  return _openAIClient;
}

/**
 * Generate a chat completion — now routes to Groq by default.
 * @param model  Use llama3-8b-8192 for chat, llama3-70b-8192 for story.
 * @deprecated Prefer calling generateGroqCompletion directly.
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  model = "llama-3.1-8b-instant",
  timeoutMs = 30_000
): Promise<string> {
  // Route to Groq for Llama models
  if (
    model.startsWith("llama") ||
    model.startsWith("mixtral") ||
    model.startsWith("meta-llama")
  ) {
    return generateGroqCompletion(
      systemPrompt,
      userMessage,
      model as "llama-3.1-8b-instant" | "llama-3.3-70b-versatile",
      timeoutMs
    );
  }

  // Fallback: OpenAI for gpt-* models (TTS wrapper still uses this path)
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.8,
  });
  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI returned empty response");
  return content;
}

/**
 * Generate a TTS audio buffer using OpenAI's TTS endpoint.
 * Groq does not have a TTS endpoint — kept on OpenAI.
 */
export async function generateOpenAITTS(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
): Promise<Buffer> {
  const client = getOpenAIClient();
  const response = await client.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3",
  });
  return Buffer.from(await response.arrayBuffer());
}
