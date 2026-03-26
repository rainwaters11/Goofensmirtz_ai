import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * WalkthroughScene2 — Session page UI mock showing the video player and
 * the "Generate Story" button being clicked.
 * Duration: 9s (270 frames @ 30fps)
 */
export const WalkthroughScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Label appears early
  const labelOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Video card slides in
  const cardY = interpolate(frame, [20, 55], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardOpacity = interpolate(frame, [20, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Persona pills appear
  const pillsOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Generate button appears + gets clicked
  const buttonOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Click press animation at frame 155
  const clickScale = frame >= 152 && frame <= 165
    ? interpolate(frame, [152, 157, 162, 165], [1, 0.93, 0.96, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  // Loading spinner starts after click
  const loadingOpacity = interpolate(frame, [168, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spinAngle = (frame - 168) * 8;

  // "Generating..." text
  const generatingOpacity = interpolate(frame, [175, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const PERSONAS = ["🎭 Dramatic Dog", "🏘️ Neighborhood Boss", "😤 Chaotic Gremlin", "👑 Royal House Cat", "😎 Chill Cat"];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0a0f 0%, #0f1118 60%, #0f0f1a 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: fadeIn * fadeOut,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "85%",
          maxWidth: 980,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Section label */}
        <div style={{ opacity: labelOpacity, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f97316", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Step 1 — Session Page
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#ffffff" }}>
            The footage is ready
          </div>
        </div>

        {/* Video player mock */}
        <div
          style={{
            opacity: cardOpacity,
            transform: `translateY(${cardY}px)`,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Fake video area */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              aspectRatio: "16/9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Play button */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(249,115,22,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(249,115,22,0.4)",
              }}
            >
              <div style={{ width: 0, height: 0, borderTop: "14px solid transparent", borderBottom: "14px solid transparent", borderLeft: "22px solid white", marginLeft: 5 }} />
            </div>
            {/* Duration badge */}
            <div style={{ position: "absolute", bottom: 12, right: 14, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "3px 10px", fontSize: 14, color: "white", fontWeight: 600 }}>
              1:58
            </div>
            {/* "catpov.mp4" label */}
            <div style={{ position: "absolute", top: 12, left: 14, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 6, padding: "4px 12px", fontSize: 13, color: "#f97316", fontWeight: 600 }}>
              📹 Goofinsmirtz's Wild Tuesday
            </div>
          </div>

          {/* Persona selector row */}
          <div style={{ padding: "16px 20px", opacity: pillsOpacity }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
              Narrator Persona
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {PERSONAS.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 4 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                    border: i === 4 ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 100,
                    padding: "7px 18px",
                    fontSize: 14,
                    fontWeight: i === 4 ? 700 : 400,
                    color: i === 4 ? "#f97316" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Story button */}
        <div style={{ display: "flex", justifyContent: "center", opacity: buttonOpacity }}>
          <div
            style={{
              background: frame >= 152 ? "rgba(249,115,22,0.9)" : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              borderRadius: 14,
              padding: "18px 52px",
              fontSize: 20,
              fontWeight: 700,
              color: "white",
              transform: `scale(${clickScale})`,
              boxShadow: frame >= 152 ? "0 0 60px rgba(249,115,22,0.5)" : "0 4px 24px rgba(249,115,22,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
          >
            {frame >= 168 ? (
              <>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTop: "3px solid white",
                    borderRadius: "50%",
                    opacity: loadingOpacity,
                    transform: `rotate(${spinAngle}deg)`,
                  }}
                />
                <span style={{ opacity: generatingOpacity }}>Generating story…</span>
              </>
            ) : (
              <>✨ Generate Story</>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
