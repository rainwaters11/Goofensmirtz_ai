/**
 * DemoPitch — Root composition for the Pet POV AI demo/pitch video.
 *
 * Sequences 9 scenes that match the demo script:
 *   1. HookScene      — Problem statement
 *   2. ProductReveal   — Pet POV AI logo reveal
 *   3. PipelineScene   — 7-step processing pipeline
 *   4. InsightsScene   — Key activities + behavioral summary
 *   5. PersonaShowcase — Side-by-side persona comparison
 *   6. AskMyPetScene   — Interactive Q&A demo
 *   7. TechStackScene  — Under the hood
 *   8. StatsScene      — Market opportunity
 *   9. ClosingScene    — "Not just recorded — understood"
 */

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { HookScene } from "./HookScene";
import { ProductReveal } from "./ProductReveal";
import { PipelineScene } from "./PipelineScene";
import { InsightsScene } from "./InsightsScene";
import { PersonaShowcase } from "./PersonaShowcase";
import { AskMyPetScene } from "./AskMyPetScene";
import { TechStackScene } from "./TechStackScene";
import { StatsScene } from "./StatsScene";
import { ClosingScene } from "./ClosingScene";

// Scene durations (in frames @ 30fps)
export const SCENE_DURATIONS = {
  hook: 210,          // 7s — Problem statement
  productReveal: 180, // 6s — Logo reveal
  pipeline: 210,      // 7s — Processing pipeline
  insights: 270,      // 9s — Key activities + summary
  persona: 270,       // 9s — Persona comparison
  askMyPet: 270,      // 9s — Chat interaction
  techStack: 210,     // 7s — Under the hood
  stats: 180,         // 6s — Market stats
  closing: 210,       // 7s — Closing statement
} as const;

export const DEMO_TOTAL_DURATION = Object.values(SCENE_DURATIONS).reduce(
  (sum, d) => sum + d,
  0
);

export const DemoPitch: React.FC = () => {
  let offset = 0;

  const scenes: Array<{
    name: string;
    duration: number;
    component: React.ReactNode;
  }> = [
    { name: "Hook", duration: SCENE_DURATIONS.hook, component: <HookScene /> },
    {
      name: "Product Reveal",
      duration: SCENE_DURATIONS.productReveal,
      component: <ProductReveal />,
    },
    {
      name: "Pipeline",
      duration: SCENE_DURATIONS.pipeline,
      component: <PipelineScene />,
    },
    {
      name: "Insights",
      duration: SCENE_DURATIONS.insights,
      component: <InsightsScene />,
    },
    {
      name: "Persona Showcase",
      duration: SCENE_DURATIONS.persona,
      component: <PersonaShowcase />,
    },
    {
      name: "Ask My Pet",
      duration: SCENE_DURATIONS.askMyPet,
      component: <AskMyPetScene />,
    },
    {
      name: "Tech Stack",
      duration: SCENE_DURATIONS.techStack,
      component: <TechStackScene />,
    },
    {
      name: "Stats",
      duration: SCENE_DURATIONS.stats,
      component: <StatsScene />,
    },
    {
      name: "Closing",
      duration: SCENE_DURATIONS.closing,
      component: <ClosingScene />,
    },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1a" }}>
      {scenes.map((scene, i) => {
        const from = offset;
        offset += scene.duration;
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={scene.duration}
            name={scene.name}
          >
            {scene.component}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
