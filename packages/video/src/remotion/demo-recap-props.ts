import type { RecapVideoProps } from "./index";

/**
 * Seeded demo props derived from the Goofinsmirtz session.
 *
 * These are used as `defaultProps` in Root.tsx so the Remotion Studio
 * opens with a fully populated preview — no backend needed.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ TODO: Connect to real session data                                 │
 * │                                                                    │
 * │ When the render pipeline is live, replace these hardcoded props    │
 * │ with values fetched from the API:                                  │
 * │                                                                    │
 * │   GET /api/sessions/:id          → petName, sessionTitle           │
 * │   GET /api/sessions/:id/recap    → personaName, recapLines (from   │
 * │                                    narrationScript split on \n)    │
 * │   GET /api/sessions/:id/assets   → audioUrl (TTS voiceover URL)   │
 * │                                                                    │
 * │ The RecapVideoProps interface is intentionally simple so the       │
 * │ mapping from API responses is straightforward.                     │
 * └─────────────────────────────────────────────────────────────────────┘
 */
export const DEMO_RECAP_PROPS: RecapVideoProps = {
  petName: "Goofinsmirtz",
  sessionTitle: "Goofinsmirtz's Wild Tuesday",
  personaName: "The Narrator",
  recapLines: [
    "First things first — the mail carrier showed up. You KNOW I had to bark about it.",
    "I gave the window a second round of barks, just to be thorough.",
    "Then I took the most luxurious nap on MY couch. Thirty whole minutes of bliss.",
    "Woke up, stretched, had some water. Self-care is important, people.",
    "Found a tennis ball near the back door. Carried it around like a trophy.",
    "Investigated a suspicious new plant. It required multiple sniffs.",
    "Hit the backyard for some legendary zoomies. Pure unfiltered joy.",
    "Finished the day cooling off on the kitchen tile. What a Tuesday.",
  ],
  // audioUrl is omitted — AudioBars will show a placeholder waveform
  audioUrl: undefined,
};
