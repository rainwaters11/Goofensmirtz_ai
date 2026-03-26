import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const QUESTION = "What was the best part of your day?";
const RESPONSE =
  "The three-hour meditation on the couch. Perfectly still. Perfectly quiet. The humans thought I was sleeping. I was achieving a level of peace they'll never comprehend.";

/**
 * AskMyPetScene — Chat interaction with typed question and AI response.
 */
export const AskMyPetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Instead of guessing..." text
  const contextOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Question bubble typing effect
  const questionChars = Math.floor(
    interpolate(frame, [45, 90], [0, QUESTION.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const questionOpacity = interpolate(frame, [40, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Thinking dots
  const thinkingOpacity = interpolate(frame, [100, 110, 125, 130], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Response
  const responseOpacity = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const responseY = interpolate(frame, [130, 145], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor blink
  const cursorVisible = frame < 95 && Math.floor(frame / 8) % 2 === 0;

  // Fade out
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Thinking dot bounce
  const dot1 = Math.sin(frame * 0.3) * 4;
  const dot2 = Math.sin(frame * 0.3 + 1) * 4;
  const dot3 = Math.sin(frame * 0.3 + 2) * 4;

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
      <div
        style={{
          width: "80%",
          maxWidth: 700,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 16, opacity: titleOpacity }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
            💬 Ask My Pet
          </div>
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
              opacity: contextOpacity,
            }}
          >
            Instead of guessing, ask the pet directly
          </div>
        </div>

        {/* Chat container */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* User question */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              opacity: questionOpacity,
            }}
          >
            <div
              style={{
                background: "rgba(249,115,22,0.15)",
                border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: "16px 16px 4px 16px",
                padding: "14px 20px",
                maxWidth: "80%",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#ffffff",
                }}
              >
                {QUESTION.slice(0, questionChars)}
              </span>
              {cursorVisible && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 22,
                    background: "#f97316",
                    marginLeft: 2,
                    verticalAlign: "text-bottom",
                  }}
                />
              )}
            </div>
          </div>

          {/* Thinking indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: thinkingOpacity,
            }}
          >
            <span style={{ fontSize: 28 }}>🐾</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[dot1, dot2, dot3].map((y, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#f97316",
                    transform: `translateY(${y}px)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* AI Response */}
          <div
            style={{
              display: "flex",
              gap: 12,
              opacity: responseOpacity,
              transform: `translateY(${responseY}px)`,
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>🐾</span>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px 16px 16px 16px",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                "{RESPONSE}"
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 10,
                }}
              >
                — Goofinsmirtz, via Chill Cat
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div
          style={{
            textAlign: "center",
            fontSize: 15,
            color: "rgba(255,255,255,0.35)",
            opacity: responseOpacity,
          }}
        >
          Response grounded in actual session data + persona personality
        </div>
      </div>
    </AbsoluteFill>
  );
};
