import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

const EVENTS = [
  { emoji: "🪤", label: "Trampoline Investigation" },
  { emoji: "🌿", label: "Jungle Trek Through the Bushes" },
  { emoji: "🌳", label: "Deep Tree Gazing" },
  { emoji: "🍚", label: "Outdoor Kibble Feast" },
  { emoji: "🐈", label: "Tortoiseshell Cat Meeting" },
  { emoji: "🍂", label: "Woodland Patrol" },
];

/**
 * WalkthroughScene1 — Goofinsmirtz's Wild Tuesday event reveal.
 * Shows the 6 real events from catpov.mp4 one by one.
 * Duration: 8s (240 frames @ 30fps)
 */
export const WalkthroughScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const headerOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pulsing amber orb
  const orbSize = Math.sin(frame * 0.025) * 30 + 500;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0a0f 0%, #0f1118 50%, #1a0e08 100%)",
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
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: orbSize,
          height: orbSize,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          padding: "0 80px",
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", opacity: headerOpacity }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f97316", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
            🐾 Pet POV AI — App Walkthrough
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>
            Goofinsmirtz's Wild Tuesday
          </div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.45)", marginTop: 10, opacity: subOpacity }}>
            A 2-minute outdoor adventure, captured on cat cam
          </div>
        </div>

        {/* Event grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            width: "100%",
          }}
        >
          {EVENTS.map((event, i) => {
            const startFrame = 55 + i * 22;
            const opacity = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame, [startFrame, startFrame + 18], [24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  background: "rgba(249,115,22,0.06)",
                  border: "1px solid rgba(249,115,22,0.18)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <span style={{ fontSize: 32 }}>{event.emoji}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>
                  {event.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subline */}
        {frame > 185 && (
          <div
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.35)",
              opacity: interpolate(frame, [185, 205], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Events extracted from actual catpov.mp4 footage
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
