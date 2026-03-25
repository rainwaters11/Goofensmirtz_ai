/**
 * PetPovComposition — root Remotion composition for Pet POV AI.
 *
 * Layers (bottom to top):
 *   1. VideoLayer  — source pet footage (background)
 *   2. AudioLayer  — TTS voiceover
 *   3. SubtitleLayer — captions / subtitles synced to voice
 *
 * SETUP REQUIRED:
 *   pnpm add remotion @remotion/core --filter @pet-pov/video
 *
 * TODO: Add title card layer for intro branding
 * TODO: Add branded overlay (logo, watermark)
 * TODO: Support vertical (9:16) and square (1:1) templates
 * TODO: Replace FFmpeg render with Remotion once this is wired to pipeline
 */

// import { AbsoluteFill, useVideoConfig } from "remotion";
// import { VideoLayer } from "./layers/VideoLayer";
// import { AudioLayer } from "./layers/AudioLayer";
// import { SubtitleLayer } from "./layers/SubtitleLayer";

import type { CompositionProps } from "./index";

/**
 * PetPovComposition — the main Remotion component.
 * Receives all pipeline outputs as props and composes the final video.
 */
export function PetPovComposition(props: CompositionProps) {
  // TODO: Uncomment once remotion is installed:
  //
  // return (
  //   <AbsoluteFill style={{ backgroundColor: "#000" }}>
  //     <VideoLayer videoUrl={props.videoUrl} />
  //     <AudioLayer audioUrl={props.audioUrl} />
  //     <SubtitleLayer subtitles={props.subtitles} />
  //   </AbsoluteFill>
  // );

  void props; // suppress unused-vars until remotion is installed
  throw new Error("Remotion not installed. See packages/video/src/remotion/index.ts");
}
