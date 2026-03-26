import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * ClosingScene — "Not just recorded — understood."
 * Final emotional punch with logo.
 */
export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // "This is just the beginning" text
  const beginOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beginFadeOut = interpolate(frame, [70, 85], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main line builds
  const mainLine1 = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mainLine2 = interpolate(frame, [110, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo
  const logoScale = spring({
    frame: Math.max(0, frame - 140),
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const logoOpacity = interpolate(frame, [140, 155], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow pulse
  const glowSize = 300 + Math.sin(frame * 0.04) * 50;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0a0a1a 0%, #0f172a 50%, #1a0e2e 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Pulsing ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: logoOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* "This is just the beginning" */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            opacity: Math.min(beginOpacity, beginFadeOut),
          }}
        >
          This is just the beginning.
        </div>

        {/* "We're building a future where..." */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "rgba(255,255,255,0.6)",
            opacity: mainLine1,
            textAlign: "center",
            paddingLeft: 60,
            paddingRight: 60,
          }}
        >
          We're building a future where your pet isn't just recorded
        </div>

        {/* "they're understood" */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            opacity: mainLine2,
            textAlign: "center",
          }}
        >
          they're{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            understood.
          </span>
        </div>

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 40,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          <span style={{ fontSize: 44 }}>🐾</span>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              background:
                "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: -1,
            }}
          >
            Pet POV AI
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
