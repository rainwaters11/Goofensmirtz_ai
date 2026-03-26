import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

const NARRATION_LINES = [
  "I sniffed that trampoline",
  "for longer than I'd like to admit.",
  "",
  "It smelled like metal... and mystery.",
  "",
  "I pushed through the bushes.",
  "Nobody asked me to. I just needed to know.",
  "",
  "I stared at that tree for a very long time.",
  "We reached an understanding.",
  "",
  "Then: food. Outside food. In a bowl.",
  "I ate it slowly.",
  "Nothing is ever worth rushing.",
];

/**
 * WalkthroughScene3 — The Pet POV narration reveal.
 * Shows the generated script appearing with persona badge.
 * Duration: 10s (300 frames @ 30fps)
 */
export const WalkthroughScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const labelOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardY = interpolate(frame, [25, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Lines type in one by one (skip empty lines)
  const visibleLines = Math.floor(
    interpolate(frame, [60, 240], [0, NARRATION_LINES.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // "from the cat's perspective" tag
  const tagOpacity = interpolate(frame, [250, 270], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing orb
  const orbPulse = Math.sin(frame * 0.04) * 20 + 380;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0a0f 0%, #0f1118 60%, #0f0f1a 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "60%",
          transform: "translate(-50%, -50%)",
          width: orbPulse,
          height: orbPulse,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      <div
        style={{
          width: "82%",
          maxWidth: 920,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Section label */}
        <div style={{ opacity: labelOpacity }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f97316", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Step 2 — The Story
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>
            Goofinsmirtz tells his day
          </div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
            in first person · from his perspective · as Chill Cat
          </div>
        </div>

        {/* Script card */}
        <div
          style={{
            opacity: cardOpacity,
            transform: `translateY(${cardY}px)`,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 20,
            padding: "28px 32px",
          }}
        >
          {/* Persona badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 100,
              padding: "6px 16px",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 18 }}>😎</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f97316" }}>Chill Cat</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>· Narrating as Goofinsmirtz</span>
          </div>

          {/* Narration lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NARRATION_LINES.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: line === "" ? 8 : 22,
                  fontWeight: 400,
                  color: line === "" ? "transparent" : "rgba(255,255,255,0.85)",
                  lineHeight: 1.65,
                  fontStyle: line === "" ? "normal" : "italic",
                }}
              >
                {line === "" ? "·" : `"${line}`}
              </div>
            ))}
            {/* Blinking cursor */}
            {visibleLines < NARRATION_LINES.length && (
              <div
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 24,
                  background: "#f97316",
                  opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
                  borderRadius: 2,
                  marginTop: 4,
                }}
              />
            )}
          </div>
        </div>

        {/* Caption tag */}
        <div
          style={{
            textAlign: "center",
            fontSize: 15,
            color: "rgba(255,255,255,0.35)",
            opacity: tagOpacity,
          }}
        >
          ✦ Generated from real session events · Species-grounded · First person throughout
        </div>
      </div>
    </AbsoluteFill>
  );
};
