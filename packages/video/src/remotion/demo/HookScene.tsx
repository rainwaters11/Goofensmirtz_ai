import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * HookScene — Problem statement that draws the viewer in.
 *
 * "Most pet owners record their pets every day…
 *  but they still don't understand what actually happened."
 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Line 1 fades in first
  const line1Opacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [10, 30], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 2 (the "but" line) fades in later with emphasis
  const line2Opacity = interpolate(frame, [60, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [60, 85], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sub-points fade in sequentially
  const point1 = interpolate(frame, [110, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const point2 = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const point3 = interpolate(frame, [150, 165], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pulsing glow orb
  const orbPulse = Math.sin(frame * 0.03) * 20 + 400;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #0a0a1a 0%, #0f172a 40%, #1a0e2e 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: fadeOut,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: orbPulse,
          height: orbPulse,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          padding: "0 80px",
          maxWidth: "85%",
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            lineHeight: 1.5,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          Most pet owners record their pets every day
        </div>

        {/* Line 2 — emphasis */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.4,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          but they still don't understand{" "}
          <span style={{ color: "#f97316" }}>what actually happened.</span>
        </div>

        {/* Sub-points */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 32,
          }}
        >
          {[
            { opacity: point1, text: "Not what triggered a behavior" },
            { opacity: point2, text: "Not what caught their attention" },
            { opacity: point3, text: "And not what it means" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                opacity: item.opacity,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
