import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface EndCardProps {
  petName: string;
  sessionTitle: string;
}

export const EndCard: React.FC<EndCardProps> = ({ petName, sessionTitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 10, mass: 0.6 } });
  const textOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [22, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #1a1a2e 0%, #0f172a 50%, #1e1b4b 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Gradient orb */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 64 }}>🐾</span>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            background: "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -1,
          }}
        >
          Pet POV AI
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 24,
          fontSize: 24,
          fontWeight: 400,
          color: "rgba(255,255,255,0.6)",
          opacity: taglineOpacity,
          textAlign: "center",
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        See the world through their eyes
      </div>

      {/* Session credit */}
      <div
        style={{
          marginTop: 48,
          opacity: textOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Starring
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#f97316",
          }}
        >
          {petName}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 400,
            color: "rgba(255,255,255,0.4)",
            marginTop: 4,
          }}
        >
          {sessionTitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
