import React from "react";
import { Composition, registerRoot } from "remotion";
import { RecapVideo } from "./composition";
import {
  COMPOSITION_ID,
  COMPOSITION_WIDTH,
  COMPOSITION_HEIGHT,
  COMPOSITION_FPS,
  TITLE_CARD_DURATION,
  RECAP_LINE_DURATION,
  END_CARD_DURATION,
} from "./index";
import { DEMO_RECAP_PROPS } from "./demo-recap-props";
import { DemoPitch, DEMO_TOTAL_DURATION } from "./demo/DemoPitch";

/**
 * Calculate total duration based on the number of recap lines.
 */
function calculateDuration(recapLineCount: number): number {
  return TITLE_CARD_DURATION + recapLineCount * RECAP_LINE_DURATION + END_CARD_DURATION;
}

export const RemotionRoot: React.FC = () => {
  const durationInFrames = calculateDuration(DEMO_RECAP_PROPS.recapLines.length);

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Composition
        id={COMPOSITION_ID}
        component={RecapVideo as React.ComponentType<any>}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        fps={COMPOSITION_FPS}
        durationInFrames={durationInFrames}
        defaultProps={DEMO_RECAP_PROPS}
      />
      <Composition
        id="DemoPitch"
        component={DemoPitch}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={DEMO_TOTAL_DURATION}
      />
    </>
  );
};

registerRoot(RemotionRoot);

