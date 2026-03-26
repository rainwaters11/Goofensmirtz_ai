import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const BAR_COUNT = 24;
const BAR_WIDTH = 8;
const BAR_GAP = 6;
const MAX_HEIGHT = 120;

/**
 * Decorative animated equalizer bars.
 * Shown as an overlay when audioUrl is present.
 */
export const AudioBars: React.FC = () => {
  const frame = useCurrentFrame();

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const phase = (i / BAR_COUNT) * Math.PI * 2;
    const speed = 0.12 + (i % 3) * 0.03;
    const height =
      MAX_HEIGHT *
      (0.3 +
        0.35 * Math.sin(frame * speed + phase) +
        0.15 * Math.sin(frame * speed * 1.7 + phase * 2.3));

    const barOpacity = interpolate(frame, [0, 15], [0, 0.85], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <div
        key={i}
        style={{
          width: BAR_WIDTH,
          height: Math.max(4, height),
          borderRadius: BAR_WIDTH / 2,
          background: `linear-gradient(180deg, #f97316 0%, #ea580c 60%, #9a3412 100%)`,
          opacity: barOpacity,
          transition: "height 0.05s ease",
        }}
      />
    );
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: BAR_GAP,
          paddingBottom: 100,
        }}
      >
        {bars}
      </div>
    </AbsoluteFill>
  );
};
