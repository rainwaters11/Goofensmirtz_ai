# Video Processing Spec

## Overview

This spec defines the expected behaviour of the video processing pipeline for Pet POV AI.

---

## Pipeline Stage: Scene Extraction

### Goal
Extract meaningful scene boundaries from raw pet-camera footage to pass to the AI event-generation step.

### Inputs
- `videoPath: string` — absolute path to the uploaded video file (MP4, MOV, or WebM)
- `intervalSeconds: number` — frame-sampling interval (default: 2)

### Outputs
- `ExtractedFrame[]` — ordered list of frame paths and timestamps
- `SceneSegment[]` — grouped frames representing discrete scenes

### Acceptance Criteria
- [ ] At least one scene is returned for any video longer than 1 second
- [ ] Frames are extracted at the specified interval (±0.5s tolerance)
- [ ] Frames are ordered chronologically
- [ ] Empty-frame arrays return zero scene segments (no crash)

---

## Pipeline Stage: PySceneDetect (future)

### Goal
Replace interval-based scene grouping with content-aware scene boundary detection using PySceneDetect.

### Inputs
- `videoPath: string`
- `threshold?: number` — detection sensitivity (default: 27.0)

### Outputs
- `SceneTimestamp[]` — `{ startSeconds, endSeconds }` for each detected scene

### Acceptance Criteria
- [ ] `scenedetect` CLI is available on the PATH or the script fails with a clear error
- [ ] Scene timestamps are monotonically increasing
- [ ] Output is parseable JSON

### Notes
- Invoked via CLI subprocess (`run-scene-detect.sh`)
- See `packages/video/src/scene-detect.ts` for the TypeScript wrapper
- TODO: Replace CLI wrapper with direct Python bindings when Python integration matures

---

## Pipeline Stage: FFmpeg Frame Merge

### Goal
Combine the original video with TTS-generated audio to produce the final rendered output.

### Inputs
- `videoPath: string` — original video (silent or with original audio)
- `audioPath: string` — TTS voiceover (MP3 or WAV)
- `outputPath: string` — destination for the rendered file

### Acceptance Criteria
- [ ] Output file exists at `outputPath` after successful merge
- [ ] Output duration ≤ source video duration (shortest flag applied)
- [ ] Function rejects with a descriptive error if either input file is missing

### Notes
- TODO: Replace FFmpeg render with Remotion for richer composition control
- See `packages/video/src/remotion/` for the Remotion scaffold

---

## Open Issues / TODOs

- [ ] Benchmark PySceneDetect threshold values against dog/cat footage samples
- [ ] Decide on a temp-file cleanup strategy (currently left in `tmp/` by workers)
- [ ] Evaluate whether Remotion can replace the FFmpeg merge step for MVP
