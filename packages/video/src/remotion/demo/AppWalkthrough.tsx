/**
 * AppWalkthrough — Judge-ready demo walkthrough composition.
 *
 * 4 scenes showing the real Pet POV AI user flow:
 *   1. WalkthroughScene1 (8s)  — Goofinsmirtz's outdoor events intro
 *   2. WalkthroughScene2 (9s)  — Session page + Generate Story click
 *   3. WalkthroughScene3 (10s) — Pet POV narration reveal (Chill Cat)
 *   4. WalkthroughScene4 (12s) — Ask My Pet: trampoline + tortoiseshell Q&A
 *
 * Total: 39s @ 30fps = 1170 frames
 */

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { WalkthroughScene1 } from "./WalkthroughScene1";
import { WalkthroughScene2 } from "./WalkthroughScene2";
import { WalkthroughScene3 } from "./WalkthroughScene3";
import { WalkthroughScene4 } from "./WalkthroughScene4";

export const WALKTHROUGH_SCENE_DURATIONS = {
  intro:    240, // 8s  — outdoor event reveal
  session:  270, // 9s  — session page + generate
  narration: 300, // 10s — narration script reveal
  askMyPet: 360, // 12s — two Q&A exchanges
} as const;

export const WALKTHROUGH_TOTAL_DURATION = Object.values(
  WALKTHROUGH_SCENE_DURATIONS
).reduce((sum, d) => sum + d, 0); // = 1170 frames = 39s

export const AppWalkthrough: React.FC = () => {
  const scenes = [
    { name: "Outdoor Adventure", duration: WALKTHROUGH_SCENE_DURATIONS.intro,    component: <WalkthroughScene1 /> },
    { name: "Session Page",      duration: WALKTHROUGH_SCENE_DURATIONS.session,   component: <WalkthroughScene2 /> },
    { name: "Narration Reveal",  duration: WALKTHROUGH_SCENE_DURATIONS.narration, component: <WalkthroughScene3 /> },
    { name: "Ask My Pet",        duration: WALKTHROUGH_SCENE_DURATIONS.askMyPet,  component: <WalkthroughScene4 /> },
  ];

  let offset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      {scenes.map((scene, i) => {
        const from = offset;
        offset += scene.duration;
        return (
          <Sequence key={i} from={from} durationInFrames={scene.duration} name={scene.name}>
            {scene.component}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
