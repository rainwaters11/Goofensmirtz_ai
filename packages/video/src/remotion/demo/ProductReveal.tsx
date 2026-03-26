import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * ProductReveal — "So we built Pet POV AI" moment.
 * Logo + tagline with dramatic spring animation.
 */
export const ProductReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // "So we built" text
  const introOpacity = interpolate(frame, [8, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo spring entrance
  const logoScale = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 10, mass: 0.7 } });
  const logoOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [70, 90], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Description lines
  const desc1 = interpolate(frame, [100, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const desc2 = interpolate(frame, [115, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const desc3 = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Rotating glow ring
  const rotation = frame * 0.5;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0a0a1a 0%, #0f172a 50%, #1a0e2e 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: fadeOut,
      }}
    >
      {/* Rotating gradient ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(249,115,22,0.15) 25%, transparent 50%, rgba(249,115,22,0.1) 75%, transparent 100%)",
          filter: "blur(40px)",
          opacity: logoOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* "So we built" */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            opacity: introOpacity,
          }}
        >
          So we built
        </div>

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        >
          <span style={{ fontSize: 72 }}>🐾</span>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              background:
                "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: -2,
            }}
          >
            Pet POV AI
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: "rgba(255,255,255,0.6)",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            marginTop: 8,
          }}
        >
          See the world through their eyes
        </div>

        {/* Capabilities */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 40,
          }}
        >
          {[
            { opacity: desc1, icon: "📊", text: "Structured insights" },
            { opacity: desc2, icon: "📖", text: "Narrated stories" },
            { opacity: desc3, icon: "💬", text: "Interactive conversations" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: item.opacity,
              }}
            >
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
