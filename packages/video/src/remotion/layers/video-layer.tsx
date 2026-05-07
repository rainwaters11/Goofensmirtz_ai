/**
 * VideoLayer — renders the source pet footage as the background of the composition.
 *
 * SETUP REQUIRED:
 *   pnpm add remotion @remotion/core --filter @pet-pov/video
 *
 * TODO: Add playback rate control (slow-mo, time-lapse effects)
 * TODO: Support multiple video clips spliced by scene boundaries
 */

// import { Video, AbsoluteFill } from "remotion";

interface VideoLayerProps {
  videoUrl: string;
}

export function VideoLayer({ videoUrl }: VideoLayerProps) {
  // TODO: Uncomment once remotion is installed:
  //
  // return (
  //   <AbsoluteFill>
  //     <Video
  //       src={videoUrl}
  //       style={{ width: "100%", height: "100%", objectFit: "cover" }}
  //     />
  //   </AbsoluteFill>
  // );

  void videoUrl;
  throw new Error("Remotion not installed. See packages/video/src/remotion/index.ts");
}
