import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const STEPS = [
  { icon: "☁️", label: "Upload to Cloudinary" },
  { icon: "🎬", label: "Extract scenes (FFmpeg)" },
  { icon: "👁️", label: "Generate events (Gemini Vision)" },
  { icon: "🔣", label: "Convert events to TOON" },
  { icon: "✍️", label: "Generate narration (GPT-4o)" },
  { icon: "🎙️", label: "Generate voiceover (TTS)" },
  { icon: "🎞️", label: "Render final video" },
];

/**
 * PipelineScene — Animated pipeline showing the 7-step processing flow.
 */
export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title entrance
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
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

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #0a0a1a 0%, #0f172a 50%, #111827 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: fadeOut,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "15%",
          transform: "translate(-50%, -50%)",
          width: 400,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          width: "80%",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#ffffff",
            opacity: titleOpacity,
            marginBottom: 12,
          }}
        >
          Processing Pipeline
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            opacity: titleOpacity,
            marginBottom: 20,
          }}
        >
          From raw footage to narrated story
        </div>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
            maxWidth: 580,
          }}
        >
          {STEPS.map((step, i) => {
            const stepDelay = 25 + i * 20;
            const stepOpacity = interpolate(
              frame,
              [stepDelay, stepDelay + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const stepX = interpolate(
              frame,
              [stepDelay, stepDelay + 12],
              [-40, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const checkDelay = stepDelay + 15;
            const checkScale = spring({
              frame: Math.max(0, frame - checkDelay),
              fps,
              config: { damping: 12 },
            });
            const isChecked = frame > checkDelay;

            // Progress bar fill
            const barFill = interpolate(
              frame,
              [stepDelay + 8, checkDelay],
              [0, 100],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: stepOpacity,
                  transform: `translateX(${stepX}px)`,
                  background: isChecked
                    ? "rgba(249,115,22,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isChecked ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 12,
                  padding: "12px 18px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Progress fill */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barFill}%`,
                    background:
                      "linear-gradient(90deg, rgba(249,115,22,0.05), rgba(249,115,22,0.12))",
                    transition: "width 0.1s ease",
                  }}
                />

                {/* Check / number */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isChecked
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: isChecked ? "#22c55e" : "rgba(255,255,255,0.4)",
                    transform: isChecked
                      ? `scale(${checkScale})`
                      : "scale(1)",
                    zIndex: 1,
                  }}
                >
                  {isChecked ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 20, zIndex: 1 }}>{step.icon}</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: isChecked ? 600 : 400,
                    color: isChecked ? "#ffffff" : "rgba(255,255,255,0.6)",
                    zIndex: 1,
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
