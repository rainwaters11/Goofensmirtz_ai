import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { SceneEvent } from "@pet-pov/db";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI;

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing required environment variable: GEMINI_API_KEY");
  }

  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

/**
 * Returns a Gemini vision model instance (gemini-1.5-pro).
 * Used ONLY for structured scene/event extraction — not for narration.
 */
export function getGeminiVisionModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({ model: "gemini-1.5-pro" });
}

/**
 * Analyse a video frame image and return structured scene events.
 * The image should be provided as a base64-encoded JPEG.
 *
 * @param imageBase64 - Base64-encoded frame image
 * @param timestampSeconds - Position of the frame within the video
 */
export async function analyseFrame(
  imageBase64: string,
  timestampSeconds: number
): Promise<SceneEvent> {
  // TODO: Implement Gemini vision call using getGeminiVisionModel()
  // Build a structured prompt, parse the JSON response, and return a SceneEvent
  throw new Error(
    `analyseFrame not yet implemented — timestamp: ${timestampSeconds}s, image length: ${imageBase64.length}`
  );
}

/**
 * Analyse multiple frames from a video clip and return an ordered list of scene events.
 */
export async function analyseVideoFrames(
  frames: Array<{ imageBase64: string; timestampSeconds: number }>
): Promise<SceneEvent[]> {
  // TODO: Process frames concurrently (with rate limiting) and aggregate results
  throw new Error(
    `analyseVideoFrames not yet implemented — ${frames.length} frames provided`
  );
}
