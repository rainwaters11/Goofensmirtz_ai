/**
 * AudioLayer — mixes the TTS voiceover into the composition.
 *
 * SETUP REQUIRED:
 *   pnpm add remotion @remotion/core --filter @pet-pov/video
 *
 * TODO: Optionally duck original video audio under voiceover (volume fade)
 * TODO: Support music bed layer at reduced volume
 */

// import { Audio } from "remotion";

interface AudioLayerProps {
  audioUrl: string;
  /** Volume multiplier for the voiceover (default 1.0) */
  volume?: number;
}

export function AudioLayer({ audioUrl, volume = 1.0 }: AudioLayerProps) {
  // TODO: Uncomment once remotion is installed:
  //
  // return <Audio src={audioUrl} volume={volume} />;

  void audioUrl;
  void volume;
  throw new Error("Remotion not installed. See packages/video/src/remotion/index.ts");
}
