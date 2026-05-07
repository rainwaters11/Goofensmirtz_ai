import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * StatsScene — "Millions of hours of unused pet footage"
 */
export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Counter animation
  const millionsCount = interpolate(frame, [20, 80], [0, 67], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line1Opacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Opacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [90, 110], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stats
  const stat1 = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stat2 = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stat3 = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Particles floating up
  const particles = Array.from({ length: 20 }, (_, i) => {
    const x = ((i * 73 + 17) % 100);
    const speed = 0.3 + (i % 5) * 0.1;
    const y = 100 - ((frame * speed + i * 30) % 120);
    const size = 3 + (i % 3) * 2;
    const opacity = y > 0 && y < 90 ? 0.15 : 0;
    return { x, y, size, opacity };
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #1a0e2e 0%, #0f172a 50%, #0a0a1a 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#f97316",
            opacity: p.opacity,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Big number */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            background:
              "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: line1Opacity,
            letterSpacing: -4,
          }}
        >
          {Math.floor(millionsCount)}M+
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "rgba(255,255,255,0.6)",
            opacity: line1Opacity,
          }}
        >
          hours of pet footage recorded daily
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 32,
          }}
        >
          {[
            { opacity: stat1, value: "85%", label: "goes unanalyzed" },
            { opacity: stat2, value: "2B+", label: "pet owners worldwide" },
            { opacity: stat3, value: "1", label: "platform to understand it" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                opacity: s.opacity,
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: i === 2 ? "#f97316" : "#ffffff",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.45)",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tag */}
        <div
          style={{
            marginTop: 40,
            fontSize: 26,
            fontWeight: 600,
            color: "#ffffff",
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          We turn that into something{" "}
          <span style={{ color: "#f97316" }}>meaningful</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
