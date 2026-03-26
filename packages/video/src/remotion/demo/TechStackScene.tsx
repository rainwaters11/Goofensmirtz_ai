import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const TECH_LAYERS = [
  {
    icon: "📹",
    label: "Raw Footage",
    desc: "User uploads pet session video",
    color: "#94a3b8",
  },
  {
    icon: "🔣",
    label: "TOON Encoding",
    desc: "Events → compact structured format",
    color: "#a78bfa",
  },
  {
    icon: "👁️",
    label: "Gemini Vision",
    desc: "Scene extraction + environment context",
    color: "#4285f4",
  },
  {
    icon: "🧠",
    label: "GPT-4o",
    desc: "Persona-driven narration + Q&A",
    color: "#22c55e",
  },
  {
    icon: "🛡️",
    label: "Fallback Safety",
    desc: "Stable mock responses if AI fails",
    color: "#f97316",
  },
];

/**
 * TechStackScene — Under the hood: the technology stack.
 */
export const TechStackScene: React.FC = () => {
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

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #0a0a1a 0%, #0f172a 50%, #111827 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          width: "85%",
          maxWidth: 700,
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center", opacity: titleOpacity }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
            ⚙️ Under the Hood
          </div>
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            Structured events → controlled prompting → grounded responses
          </div>
        </div>

        {/* Tech layers */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            marginTop: 12,
          }}
        >
          {TECH_LAYERS.map((layer, i) => {
            const delay = 30 + i * 22;
            const layerOpacity = interpolate(
              frame,
              [delay, delay + 14],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const layerX = interpolate(
              frame,
              [delay, delay + 14],
              [i % 2 === 0 ? -50 : 50, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            // Connection line to next
            const showLine = i < TECH_LAYERS.length - 1;
            const lineOpacity = interpolate(
              frame,
              [delay + 10, delay + 18],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${layer.color}33`,
                    borderLeft: `3px solid ${layer.color}`,
                    borderRadius: 12,
                    padding: "14px 20px",
                    opacity: layerOpacity,
                    transform: `translateX(${layerX}px)`,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{layer.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: layer.color,
                      }}
                    >
                      {layer.label}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 2,
                      }}
                    >
                      {layer.desc}
                    </div>
                  </div>
                </div>
                {showLine && (
                  <div
                    style={{
                      width: 2,
                      height: 16,
                      background: `${layer.color}44`,
                      marginLeft: 36,
                      opacity: lineOpacity,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
