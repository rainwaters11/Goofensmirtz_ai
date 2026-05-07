import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface RecapLineProps {
  line: string;
  lineIndex: number;
  totalLines: number;
}

export const RecapLine: React.FC<RecapLineProps> = ({
  line,
  lineIndex,
  totalLines,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in with slide-up
  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const slideUp = interpolate(entrance, [0, 1], [60, 0]);
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out near end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Subtle background hue rotation per line
  const hueShift = (lineIndex / Math.max(totalLines, 1)) * 30;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(170deg, hsl(${220 + hueShift}, 40%, 12%) 0%, hsl(${210 + hueShift}, 50%, 8%) 100%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 60,
      }}
    >
      {/* Decorative line counter */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 60,
          fontSize: 18,
          fontWeight: 700,
          color: "rgba(249,115,22,0.5)",
          opacity,
        }}
      >
        {lineIndex + 1} / {totalLines}
      </div>

      {/* Quote mark decoration */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: 50,
          fontSize: 200,
          fontWeight: 900,
          color: "rgba(249,115,22,0.08)",
          lineHeight: 1,
          opacity,
        }}
      >
        &ldquo;
      </div>

      {/* Recap text */}
      <div
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.4,
          opacity,
          transform: `translateY(${slideUp}px)`,
          maxWidth: "85%",
          textShadow: "0 2px 20px rgba(0,0,0,0.4)",
        }}
      >
        {line}
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: interpolate(frame, [5, 30], [0, 200], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 3,
          borderRadius: 2,
          background: "linear-gradient(90deg, transparent, #f97316, transparent)",
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};
