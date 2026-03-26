import type { SceneEvent } from "@pet-pov/db";

/**
 * TOON Decoder
 *
 * Converts a TOON-formatted string back into structured SceneEvent objects.
 * This enables round-trip verification and debugging.
 *
 * See encoder.ts for the TOON format specification.
 */

const DELIMITER = " | ";
const EVENT_SEPARATOR = "\n";

/**
 * Decode a single TOON event line back into a SceneEvent.
 * Throws if the line does not match the expected format.
 */
export function decodeEvent(line: string): SceneEvent {
  const parts = line.split(DELIMITER);

  if (parts.length < 6) {
    throw new Error(`Invalid TOON line — expected 6 parts, got ${parts.length}: "${line}"`);
  }

  const [timestampPart, description, subjectsPart, actionsPart, emotionPart, envPart] =
    parts as [string, string, string, string, string, string];

  // Parse timestamp: [T:0.00-5.00]
  const timestampMatch = timestampPart.match(/\[T:([\d.]+)-([\d.]+)\]/);
  if (!timestampMatch) {
    throw new Error(`Invalid TOON timestamp format: "${timestampPart}"`);
  }

  const timestamp_start = parseFloat(timestampMatch[1] ?? "0");
  const timestamp_end = parseFloat(timestampMatch[2] ?? "0");

  // Parse subjects: S:cat,human
  const subjects = (subjectsPart.replace("S:", "") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Parse actions: A:chasing,sniffing
  const actions = (actionsPart.replace("A:", "") || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  // Parse emotion: E:excited
  const emotion = emotionPart.replace("E:", "").trim();

  // Parse environment: ENV:backyard
  const environment = envPart.replace("ENV:", "").trim();

  return {
    timestamp_start,
    timestamp_end,
    description: description.trim(),
    subjects,
    actions,
    emotion,
    environment,
    confidence: 1, // confidence is not encoded in TOON; default to 1 on decode
  };
}

/**
 * Decode a multi-line TOON string back into an array of SceneEvents.
 */
export function decodeEvents(toon: string): SceneEvent[] {
  return toon
    .split(EVENT_SEPARATOR)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(decodeEvent);
}
