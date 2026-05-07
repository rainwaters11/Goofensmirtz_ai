import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// ─── Timing constants (30fps) ─────────────────────────────────────────────────
// 0–90   : Insights view builds in (activity cards + behavioral summary)
// 90–120 : Screen "glitches" / transitions to alert state
// 120–end: Safety alert dominates with pulsing red overlay

const ACTIVITIES = [
  { emoji: "🐕", label: "Barks at mail carrier", energy: "high" },
  { emoji: "🛋️", label: "Nap on the couch",       energy: "calm" },
  { emoji: "🎾", label: "Discovers tennis ball",   energy: "high" },
];

const ALERT_START = 110; // frame when alert kicks in

// ─── Sub-components ──────────────────────────────────────────────────────────

function PulsingRing({ frame, fps }: { frame: number; fps: number }) {
  const rings = [0, 10, 20];
  return (
    <>
      {rings.map((offset, i) => {
        const f = Math.max(0, frame - ALERT_START - offset);
        const scale = spring({ frame: f, fps, config: { damping: 200, stiffness: 80 } });
        const loop = ((frame - ALERT_START - offset) % 40) / 40;
        const ringOpacity = loop < 0.7 ? interpolate(loop, [0, 0.3, 0.7], [0.7, 0.4, 0]) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 120 + i * 40,
              height: 120 + i * 40,
              borderRadius: "50%",
              border: "3px solid rgba(239,68,68,0.6)",
              opacity: frame > ALERT_START + offset ? ringOpacity : 0,
              transform: `scale(${1 + (loop < 0.7 ? loop * 0.6 : 0)})`,
            }}
          />
        );
      })}
    </>
  );
}

// ─── Main scene ───────────────────────────────────────────────────────────────

export const SafetyAlertScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Global fade in/out
  const globalOpacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Alert reveal
  const alertProgress = interpolate(frame, [ALERT_START, ALERT_START + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Alert scale spring
  const alertScale = spring({
    frame: Math.max(0, frame - ALERT_START),
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // Red overlay pulse (slower sine wave after alert starts)
  const sinePulse =
    frame > ALERT_START
      ? 0.08 + 0.07 * Math.sin(((frame - ALERT_START) / fps) * Math.PI * 2)
      : 0;

  // Screen flash on alert trigger
  const flashOpacity = interpolate(
    frame,
    [ALERT_START, ALERT_START + 4, ALERT_START + 12],
    [0, 0.85, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Timestamp blink after alert
  const timestampOpacity =
    frame > ALERT_START + 20
      ? 0.5 + 0.5 * Math.sin(((frame - ALERT_START - 20) / fps) * Math.PI * 3)
      : 0;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(170deg, #0a0a1a 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: globalOpacity,
        overflow: "hidden",
      }}
    >
      {/* ── Red pulsing background overlay (post-alert) ─────────────────── */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(239,68,68,0.18) 0%, transparent 70%)",
          opacity: sinePulse * 10, // amplify; sinePulse is small decimal
          pointerEvents: "none",
        }}
      />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ padding: "52px 80px", display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
            opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 30 }}>⚡</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff" }}>
            Insights — What Happened
          </span>
        </div>
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.45)",
            marginBottom: 32,
            opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          AI-detected key activities from the session
        </div>

        {/* Activity cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 28 }}>
          {ACTIVITIES.map((act, i) => {
            const delay = 25 + i * 18;
            const cardOpacity = interpolate(frame, [delay, delay + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const cardY = interpolate(frame, [delay, delay + 12], [18, 0], {
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
                      ? "rgba(249,115,22,0.10)"
                      : "rgba(96,165,250,0.10)",
                  border: `1px solid ${act.energy === "high" ? "rgba(249,115,22,0.25)" : "rgba(96,165,250,0.2)"}`,
                  borderRadius: 10,
                  padding: "10px 18px",
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                }}
              >
                <span style={{ fontSize: 22 }}>{act.emoji}</span>
                <span style={{ fontSize: 17, fontWeight: 500, color: "#ffffff" }}>
                  {act.label}
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
            padding: "16px 22px",
            marginBottom: 20,
            opacity: interpolate(frame, [75, 95], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, letterSpacing: 2, marginBottom: 8 }}>
            Behavioral Summary
          </div>
          <div style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
            A mix of{" "}
            <span style={{ color: "#f97316", fontWeight: 600 }}>high-energy</span> and{" "}
            <span style={{ color: "#60a5fa", fontWeight: 600 }}>calm</span> periods.
            Emotional arc moved from "excited" → "tired."
          </div>
        </div>

        {/* ── Safety section — flips from green → red alert ───────────────── */}
        <div style={{ position: "relative", marginTop: 4 }}>

          {/* Green "all clear" — fades out as alert comes in */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 10,
              padding: "14px 20px",
              opacity: interpolate(frame, [75, 95, 105, ALERT_START], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              position: "absolute" as const,
              width: "100%",
              boxSizing: "border-box" as const,
            }}
          >
            <span style={{ fontSize: 22 }}>🛡️</span>
            <span style={{ fontSize: 17, fontWeight: 600, color: "#22c55e" }}>Safety:</span>
            <span style={{ fontSize: 17, color: "rgba(255,255,255,0.7)" }}>No concerning behaviors detected</span>
          </div>

          {/* ── RED ALERT card ──────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "rgba(239,68,68,0.12)",
              border: "2px solid rgba(239,68,68,0.7)",
              borderRadius: 14,
              padding: "18px 24px",
              opacity: alertProgress,
              transform: `scale(${alertScale})`,
              boxShadow: `0 0 ${40 * alertProgress}px rgba(239,68,68,0.35)`,
              position: "absolute" as const,
              width: "100%",
              boxSizing: "border-box" as const,
            }}
          >
            {/* Pulsing warning icon area */}
            <div style={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PulsingRing frame={frame} fps={fps} />
              <span style={{ fontSize: 32, position: "relative", zIndex: 1 }}>🚨</span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: "#ef4444", textTransform: "uppercase" as const, letterSpacing: 1 }}>
                  Safety Alert
                </span>
                {/* Blinking timestamp */}
                <div
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#ef4444",
                    opacity: timestampOpacity,
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  03:20 AM
                </div>
              </div>
              <div style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, fontWeight: 500 }}>
                Open balcony door detected — owner can{" "}
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>act immediately</span>
              </div>
            </div>

            {/* Action badge */}
            <div
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.5)",
                borderRadius: 10,
                padding: "10px 18px",
                textAlign: "center" as const,
                flexShrink: 0,
                opacity: alertProgress,
              }}
            >
              <div style={{ fontSize: 22 }}>📲</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginTop: 4 }}>
                Notify owner
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── White flash on alert trigger ──────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: "rgba(239,68,68,1)",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// Duration: ~7 seconds at 30fps = 210 frames
export const SAFETY_ALERT_DURATION = 210;
