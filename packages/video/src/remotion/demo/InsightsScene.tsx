import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const ACTIVITIES = [
  { emoji: "🐕", text: "Barks at mail carrier", energy: "high" },
  { emoji: "🛋️", text: "Naps on the couch (30 min)", energy: "calm" },
  { emoji: "🎾", text: "Finds a tennis ball", energy: "high" },
  { emoji: "🌿", text: "Investigates new plant", energy: "calm" },
  { emoji: "💨", text: "Backyard zoomies", energy: "high" },
];

/**
 * InsightsScene — Key activities detected + behavioral summary.
 */
export const InsightsScene: React.FC = () => {
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

  // Activity score bar
  const scoreWidth = interpolate(frame, [180, 210], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Safety badge
  const safetyOpacity = interpolate(frame, [220, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const safetyScale = spring({
    frame: Math.max(0, frame - 220),
    fps,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #0a0a1a 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "60px 80px",
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          opacity: titleOpacity,
        }}
      >
        <span style={{ fontSize: 32 }}>⚡</span>
        <span style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
          Insights — What Happened
        </span>
      </div>
      <div
        style={{
          fontSize: 20,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 36,
          opacity: titleOpacity,
        }}
      >
        AI-detected key activities from the session
      </div>

      {/* Activity cards grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {ACTIVITIES.map((act, i) => {
          const delay = 30 + i * 20;
          const cardOpacity = interpolate(frame, [delay, delay + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardY = interpolate(frame, [delay, delay + 12], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background:
                  act.energy === "high"
                    ? "rgba(249,115,22,0.1)"
                    : "rgba(96,165,250,0.1)",
                border: `1px solid ${act.energy === "high" ? "rgba(249,115,22,0.25)" : "rgba(96,165,250,0.2)"}`,
                borderRadius: 10,
                padding: "10px 16px",
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
              }}
            >
              <span style={{ fontSize: 22 }}>{act.emoji}</span>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  color: "#ffffff",
                }}
              >
                {act.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Behavioral summary */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderLeft: "3px solid #f97316",
          borderRadius: 10,
          padding: "18px 24px",
          marginBottom: 20,
          opacity: interpolate(frame, [150, 170], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase" as const,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          What It Means
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
          A mix of <span style={{ color: "#f97316", fontWeight: 600 }}>high-energy</span> and{" "}
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>calm</span> periods.
          Emotional arc moved from "excited" to "tired."
        </div>
      </div>

      {/* Activity score bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          opacity: interpolate(frame, [180, 195], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: "#f97316" }}>
          Activity
        </span>
        <div
          style={{
            flex: 1,
            height: 8,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${scoreWidth}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #f97316, #fb923c)",
              borderRadius: 4,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#f97316",
          }}
        >
          100/100
        </span>
      </div>

      {/* Safety check */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 10,
          padding: "12px 18px",
          opacity: safetyOpacity,
          transform: `scale(${safetyScale})`,
        }}
      >
        <span style={{ fontSize: 22 }}>🛡️</span>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#22c55e" }}>
          Safety:
        </span>
        <span style={{ fontSize: 17, color: "rgba(255,255,255,0.7)" }}>
          No concerning behaviors detected
        </span>
      </div>
    </AbsoluteFill>
  );
};
