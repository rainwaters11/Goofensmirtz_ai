/**
 * Remotion entry-point types & constants for the Pet POV recap video.
 *
 * This module defines the input schema (`RecapVideoProps`) consumed by
 * the RecapVideo composition registered in Root.tsx.
 */

export const COMPOSITION_ID = "RecapVideo";
export const COMPOSITION_WIDTH = 1080;
export const COMPOSITION_HEIGHT = 1920; // 9:16 vertical for short-form
export const COMPOSITION_FPS = 30;

/** Duration in frames for each scene segment */
export const TITLE_CARD_DURATION = 90; // 3 seconds
export const RECAP_LINE_DURATION = 75; // 2.5 seconds per line
export const END_CARD_DURATION = 90; // 3 seconds

/**
 * Props accepted by the RecapVideo composition.
 *
 * TODO: Wire these from real session data via the Experience Recap pipeline.
 *       For now, seeded via demo-recap-props.ts for preview/demo purposes.
 */
export interface RecapVideoProps {
  /** Display name of the pet */
  petName: string;
  /** Title of the session (e.g. "Goofinsmirtz's Wild Tuesday") */
  sessionTitle: string;
  /** Name of the narration persona */
  personaName: string;
  /** Array of short recap lines narrated from the pet's perspective */
  recapLines: string[];
  /** Optional audio URL — when present, the AudioBars overlay is shown */
  audioUrl?: string;
}
