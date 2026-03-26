/**
 * RecapVideo — root Remotion composition for the Pet POV AI recap video.
 *
 * Sequences scenes:
 *   1. TitleCard    — pet name, session title, persona badge
 *   2. RecapLine[]  — each recap text as an animated subtitle card
 *   3. EndCard      — Pet POV AI branding & starring credit
 *
 * AudioBars overlay is shown throughout recap lines when audioUrl is provided.
 */

import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig, interpolate, useCurrentFrame } from "remotion";
import type { RecapVideoProps } from "./index";
import {
  TITLE_CARD_DURATION,
  RECAP_LINE_DURATION,
  END_CARD_DURATION,
} from "./index";
import { TitleCard } from "./scenes/TitleCard";
import { RecapLine } from "./scenes/RecapLine";
import { AudioBars } from "./scenes/AudioBars";
import { EndCard } from "./scenes/EndCard";

/**
 * Cross-fade transition wrapper.
 * Fades out the last few frames of each sequence for smooth transitions.
 */
const FadeTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const RecapVideo: React.FC<RecapVideoProps> = ({
  petName,
  sessionTitle,
  personaName,
  recapLines,
  audioUrl,
}) => {
  const recapCount = recapLines.length;
  const recapTotalDuration = recapCount * RECAP_LINE_DURATION;

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      {/* ── Title Card ──────────────────────────── */}
      <Sequence from={currentFrame} durationInFrames={TITLE_CARD_DURATION} name="Title Card">
        <FadeTransition>
          <TitleCard
            petName={petName}
            sessionTitle={sessionTitle}
            personaName={personaName}
          />
        </FadeTransition>
      </Sequence>

      {(() => {
        currentFrame += TITLE_CARD_DURATION;
        return null;
      })()}

      {/* ── Recap Lines ─────────────────────────── */}
      {recapLines.map((line, i) => {
        const from = TITLE_CARD_DURATION + i * RECAP_LINE_DURATION;
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={RECAP_LINE_DURATION}
            name={`Recap Line ${i + 1}`}
          >
            <FadeTransition>
              <RecapLine
                line={line}
                lineIndex={i}
                totalLines={recapCount}
              />
            </FadeTransition>
          </Sequence>
        );
      })}

      {/* ── Audio Bars Overlay (during recap lines) ── */}
      {audioUrl != null && (
        <Sequence
          from={TITLE_CARD_DURATION}
          durationInFrames={recapTotalDuration}
          name="Audio Bars"
        >
          <AudioBars />
        </Sequence>
      )}

      {/* ── End Card ────────────────────────────── */}
      <Sequence
        from={TITLE_CARD_DURATION + recapTotalDuration}
        durationInFrames={END_CARD_DURATION}
        name="End Card"
      >
        <FadeTransition>
          <EndCard petName={petName} sessionTitle={sessionTitle} />
        </FadeTransition>
      </Sequence>
    </AbsoluteFill>
  );
};
