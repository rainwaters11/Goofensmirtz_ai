/**
 * Remotion scaffold — Pet POV AI video composition
 *
 * SETUP REQUIRED before using:
 *   pnpm add remotion @remotion/core --filter @pet-pov/video
 *
 * Then uncomment the Remotion imports below.
 *
 * TODO: Replace FFmpeg render with Remotion composition once integration matures.
 */

// import { Composition } from "remotion";
// import { PetPovComposition, COMPOSITION_ID } from "./PetPovComposition";

export const COMPOSITION_ID = "PetPovVideo";
export const COMPOSITION_WIDTH = 1080;
export const COMPOSITION_HEIGHT = 1920; // 9:16 vertical for short-form
export const COMPOSITION_FPS = 30;

export interface CompositionProps {
  /** Cloudinary URL of the source video */
  videoUrl: string;
  /** Cloudinary URL of the TTS voiceover audio */
  audioUrl: string;
  /** Ordered subtitle/caption segments aligned to voice timing */
  subtitles: SubtitleSegment[];
  /** Duration of the final output in frames */
  durationInFrames: number;
}

export interface SubtitleSegment {
  startFrame: number;
  endFrame: number;
  text: string;
}

/**
 * registerCompositions — call from remotion.config.ts when Remotion is installed.
 *
 * Example:
 *   import { registerCompositions } from "./src/remotion";
 *   registerCompositions();
 *
 * TODO: Wire to real video/audio/subtitle data from the pipeline.
 */
export function registerCompositions(): void {
  // TODO: Uncomment once remotion is installed
  //
  // <Composition
  //   id={COMPOSITION_ID}
  //   component={PetPovComposition}
  //   width={COMPOSITION_WIDTH}
  //   height={COMPOSITION_HEIGHT}
  //   fps={COMPOSITION_FPS}
  //   durationInFrames={300}  // TODO: derive from actual video duration
  //   defaultProps={{
  //     videoUrl: "",
  //     audioUrl: "",
  //     subtitles: [],
  //     durationInFrames: 300,
  //   }}
  // />
  throw new Error("Remotion not installed. Run: pnpm add remotion @remotion/core --filter @pet-pov/video");
}
