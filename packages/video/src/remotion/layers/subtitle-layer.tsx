/**
 * SubtitleLayer — renders caption text synced to the TTS voiceover.
 *
 * SETUP REQUIRED:
 *   pnpm add remotion @remotion/core --filter @pet-pov/video
 *
 * TODO: Style subtitles to match persona brand (font, colour, position)
 * TODO: Add word-level highlight animation for karaoke effect
 * TODO: Support upper / lower / side caption positioning presets
 */

// import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

import type { SubtitleSegment } from "../index";

interface SubtitleLayerProps {
  subtitles: SubtitleSegment[];
}

export function SubtitleLayer({ subtitles }: SubtitleLayerProps) {
  // TODO: Uncomment once remotion is installed:
  //
  // const frame = useCurrentFrame();
  //
  // const active = subtitles.find(
  //   (s) => frame >= s.startFrame && frame <= s.endFrame
  // );
  //
  // const opacity = active
  //   ? interpolate(frame, [active.startFrame, active.startFrame + 5], [0, 1], {
  //       extrapolateLeft: "clamp",
  //       extrapolateRight: "clamp",
  //     })
  //   : 0;
  //
  // return (
  //   <AbsoluteFill
  //     style={{
  //       justifyContent: "flex-end",
  //       alignItems: "center",
  //       paddingBottom: 80,
  //       opacity,
  //     }}
  //   >
  //     <div
  //       style={{
  //         backgroundColor: "rgba(0,0,0,0.6)",
  //         borderRadius: 12,
  //         padding: "10px 20px",
  //         maxWidth: "80%",
  //         color: "#fff",
  //         fontSize: 36,
  //         fontWeight: 700,
  //         textAlign: "center",
  //         lineHeight: 1.3,
  //       }}
  //     >
  //       {active?.text ?? ""}
  //     </div>
  //   </AbsoluteFill>
  // );

  void subtitles;
  throw new Error("Remotion not installed. See packages/video/src/remotion/index.ts");
}
