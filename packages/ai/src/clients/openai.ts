import OpenAI from "openai";

let _client: OpenAI | null = null;

/**
 * Returns a singleton OpenAI client.
 * The client is lazy-initialised on first use.
 */
export function getOpenAIClient(): OpenAI {
  if (_client) return _client;

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  _client = new OpenAI({ apiKey });
  return _client;
}

/**
 * Generate a chat completion using GPT-4o.
 * This is used exclusively for narration — never for vision/perception tasks.
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  model = "gpt-4o"
): Promise<string> {
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
 * Returns a Buffer containing the MP3 audio.
 */
export async function generateOpenAITTS(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
): Promise<Buffer> {
  const client = getOpenAIClient();

  // TODO: Implement TTS generation using client.audio.speech.create()
  // Return the audio as a Buffer
  throw new Error(
    `generateOpenAITTS not yet implemented — text length: ${text.length}, voice: ${voice}`
  );
}
