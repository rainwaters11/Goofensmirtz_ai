import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const DRAMATIC_DOG_LINES = [
  "Okay so first of all — who IS that guy who keeps coming to the door?",
  "I handled it. Loudly. Twice.",
  "Then I decided the couch needed me more than the backyard did.",
];

const CHILL_CAT_LINES = [
  "So... a human came to the door. Again.",
  "I observed from the windowsill. Effortlessly.",
  "Everything is intentional.",
];

/**
 * PersonaShowcase — Side-by-side comparison of two personas.
 */
export const PersonaShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Left panel (Dramatic Dog) slides in
  const leftX = interpolate(frame, [25, 50], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leftOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Right panel (Chill Cat) slides in
  const rightX = interpolate(frame, [40, 65], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Same events" text
  const sameText = interpolate(frame, [170, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diffText = interpolate(frame, [200, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const renderCard = (
    title: string,
    emoji: string,
    color: string,
    lines: string[],
    panelOpacity: number,
    panelX: number,
    startDelay: number
  ) => (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${color}33`,
        borderRadius: 16,
        padding: "24px 28px",
        opacity: panelOpacity,
        transform: `translateX(${panelX}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 14,
          borderBottom: `1px solid ${color}22`,
        }}
      >
        <span style={{ fontSize: 28 }}>{emoji}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>
          {title}
        </span>
      </div>

      {/* Lines */}
      {lines.map((line, i) => {
        const lineDelay = startDelay + i * 25;
        const lineOpacity = interpolate(
          frame,
          [lineDelay, lineDelay + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div
            key={i}
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              fontStyle: "italic",
              opacity: lineOpacity,
              paddingLeft: 16,
              borderLeft: `2px solid ${color}44`,
            }}
          >
            "{line}"
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #0a0a1a 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "50px 60px",
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 32, opacity: titleOpacity }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
          🎭 Character Perspectives
        </div>
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.5)",
            marginTop: 8,
          }}
        >
          Same session — different personality
        </div>
      </div>

      {/* Side by side */}
      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        {renderCard(
          "Dramatic Dog",
          "🐕",
          "#f97316",
          DRAMATIC_DOG_LINES,
          leftOpacity,
          leftX,
          60
        )}
        {renderCard(
          "Chill Cat",
          "😎",
          "#60a5fa",
          CHILL_CAT_LINES,
          rightOpacity,
          rightX,
          80
        )}
      </div>

      {/* Bottom text */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            opacity: sameText,
          }}
        >
          Same events
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#f97316",
            opacity: diffText,
            marginTop: 4,
          }}
        >
          completely different perspective
        </div>
      </div>
    </AbsoluteFill>
  );
};
