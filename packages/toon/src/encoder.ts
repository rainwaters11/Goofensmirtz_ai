import type { SceneEvent } from "@pet-pov/db";

/**
 * TOON (Token-Optimised Object Notation) Encoder
 *
 * TOON is a compact, deterministic, human-readable format for sending
 * structured scene event data to LLMs. It is NOT stored in the database.
 *
 * Format:
 *   [T:{start}-{end}] {description} | S:{subjects} | A:{actions} | E:{emotion} | ENV:{environment}
 *
 * Rules:
 * - Must be deterministic: same input always produces same output
 * - Must be reversible: can be decoded back to SceneEvent[]
 * - Compact to minimise token usage
 * - Avoid JSON verbosity while preserving all semantic content
 */

const DELIMITER = " | ";
const EVENT_SEPARATOR = "\n";

/**
 * Encode a single SceneEvent into a TOON string.
 */
export function encodeEvent(event: SceneEvent): string {
  const timestamp = `[T:${event.timestamp_start.toFixed(2)}-${event.timestamp_end.toFixed(2)}]`;
  const description = event.description;
  const subjects = `S:${event.subjects.join(",")}`;
  const actions = `A:${event.actions.join(",")}`;
  const emotion = `E:${event.emotion}`;
  const environment = `ENV:${event.environment}`;

  return [timestamp, description, subjects, actions, emotion, environment].join(
    DELIMITER
  );
}

/**
 * Encode an array of SceneEvents into a multi-line TOON string.
 * This is the value that gets passed to the LLM for narration.
 */
export function encodeEvents(events: SceneEvent[]): string {
  return events.map(encodeEvent).join(EVENT_SEPARATOR);
}
