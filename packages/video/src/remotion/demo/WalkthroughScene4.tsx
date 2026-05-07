import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

const Q1 = "Why didn't you jump on the trampoline?";
const A1 = "Jump on it? I'm a cat, not a kangaroo. I investigated it thoroughly. I sniffed every spring, every leg, every suspicious inch. My findings are classified.";

const Q2 = "Who was your friend by the tree?";
const A2 = "A tortoiseshell. We touched noses. She was calm, which I respect. I've added her to my approved contacts list. I don't do that lightly.";

/**
 * WalkthroughScene4 — Ask My Pet two-question demo.
 * Shows judges two real questions with in-character cat responses.
 * Duration: 12s (360 frames @ 30fps)
 */
export const WalkthroughScene4: React.FC = () => {
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

  //  ─── Question 1 timeline ───────────────────────────────
  // Q1 types in: frames 50–100
  const q1Chars = Math.floor(interpolate(frame, [50, 100], [0, Q1.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const q1Opacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Thinking: frames 108–128
  const think1Opacity = interpolate(frame, [108, 115, 125, 130], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // A1 appears: frames 132+
  const a1Opacity = interpolate(frame, [132, 150], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const a1Y = interpolate(frame, [132, 150], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ─── Question 2 timeline ────────────────────────────────
  // Q2 types in: frames 200–255
  const q2Chars = Math.floor(interpolate(frame, [200, 255], [0, Q2.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const q2Opacity = interpolate(frame, [195, 210], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Thinking: frames 263–283
  const think2Opacity = interpolate(frame, [263, 270, 280, 285], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // A2 appears: frames 287+
  const a2Opacity = interpolate(frame, [287, 305], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const a2Y = interpolate(frame, [287, 305], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Cursor blink helpers
  const cursor1 = frame >= 50 && frame < 103 && Math.floor(frame / 8) % 2 === 0;
  const cursor2 = frame >= 200 && frame < 258 && Math.floor(frame / 8) % 2 === 0;

  const dot = (offset: number) => Math.sin(frame * 0.3 + offset) * 5;

  const ThinkingDots = () => (
    <div style={{ display: "flex", gap: 5 }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 8, height: 8,
            borderRadius: "50%",
            background: "#f97316",
            transform: `translateY(${dot(i)}px)`,
          }}
        />
      ))}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0a0f 0%, #0f1118 50%, #111827 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div style={{ width: "80%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Label */}
        <div style={{ opacity: labelOpacity }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f97316", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Step 3 — Ask My Pet
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#ffffff" }}>
            💬 Ask Goofinsmirtz anything
          </div>
          <div style={{ fontSize: 19, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
            Questions about his actual day · In character · First person
          </div>
        </div>

        {/* Chat container */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "22px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* ── Q1 ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", opacity: q1Opacity }}>
            <div style={{ background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "16px 16px 4px 16px", padding: "12px 18px", maxWidth: "78%" }}>
              <span style={{ fontSize: 18, fontWeight: 500, color: "#ffffff" }}>
                {Q1.slice(0, q1Chars)}
              </span>
              {cursor1 && <span style={{ display: "inline-block", width: 2, height: 20, background: "#f97316", marginLeft: 2, verticalAlign: "text-bottom" }} />}
            </div>
          </div>

          {/* Thinking 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: think1Opacity }}>
            <span style={{ fontSize: 24 }}>🐾</span>
            <ThinkingDots />
          </div>

          {/* A1 */}
          <div style={{ display: "flex", gap: 12, opacity: a1Opacity, transform: `translateY(${a1Y}px)` }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>🐾</span>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "4px 16px 16px 16px", padding: "14px 18px" }}>
              <div style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontStyle: "italic" }}>
                "{A1}"
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                — Goofinsmirtz, via Chill Cat
              </div>
            </div>
          </div>

          {/* ── Q2 ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", opacity: q2Opacity }}>
            <div style={{ background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "16px 16px 4px 16px", padding: "12px 18px", maxWidth: "78%" }}>
              <span style={{ fontSize: 18, fontWeight: 500, color: "#ffffff" }}>
                {Q2.slice(0, q2Chars)}
              </span>
              {cursor2 && <span style={{ display: "inline-block", width: 2, height: 20, background: "#f97316", marginLeft: 2, verticalAlign: "text-bottom" }} />}
            </div>
          </div>

          {/* Thinking 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: think2Opacity }}>
            <span style={{ fontSize: 24 }}>🐾</span>
            <ThinkingDots />
          </div>

          {/* A2 */}
          <div style={{ display: "flex", gap: 12, opacity: a2Opacity, transform: `translateY(${a2Y}px)` }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>🐾</span>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "4px 16px 16px 16px", padding: "14px 18px" }}>
              <div style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontStyle: "italic" }}>
                "{A2}"
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                — Goofinsmirtz, via Chill Cat
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {frame > 315 && (
          <div
            style={{
              textAlign: "center",
              fontSize: 15,
              color: "rgba(255,255,255,0.35)",
              opacity: interpolate(frame, [315, 335], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            ✦ Context-aware · Grounded in real session events · Never breaks character
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
