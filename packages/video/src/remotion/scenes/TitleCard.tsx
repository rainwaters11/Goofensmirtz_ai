import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface TitleCardProps {
  petName: string;
  sessionTitle: string;
  personaName: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  petName,
  sessionTitle,
  personaName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const titleScale = spring({ frame, fps, config: { damping: 12 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeSlide = interpolate(frame, [25, 45], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "-5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Pet emoji */}
      <div
        style={{
          fontSize: 80,
          marginBottom: 24,
          transform: `scale(${titleScale})`,
        }}
      >
        🐾
      </div>

      {/* Pet name */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          transform: `scale(${titleScale})`,
          lineHeight: 1.1,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        {petName}
      </div>

      {/* Session title */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: "rgba(255,255,255,0.7)",
          marginTop: 16,
          opacity: subtitleOpacity,
          textAlign: "center",
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        {sessionTitle}
      </div>

      {/* Persona badge */}
      <div
        style={{
          marginTop: 40,
          opacity: badgeOpacity,
          transform: `translateY(${badgeSlide}px)`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(249,115,22,0.15)",
          border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: 999,
          padding: "10px 24px",
        }}
      >
        <span style={{ fontSize: 18, color: "#f97316" }}>🎭</span>
        <span style={{ fontSize: 20, fontWeight: 600, color: "#f97316" }}>
          {personaName}
        </span>
      </div>
    </AbsoluteFill>
  );
};
