import type { ExtractedFrame } from "./ffmpeg.js";

export interface SceneSegment {
  startSeconds: number;
  endSeconds: number;
  frames: ExtractedFrame[];
  /** Keyframe representative of the scene (middle frame) */
  keyFrame: ExtractedFrame;
}

/**
 * Group extracted frames into scene segments using simple interval-based detection.
 * For production, this should be replaced with PySceneDetect or a similar tool.
 *
 * @param frames - Ordered list of extracted frames
 * @param sceneDurationSeconds - Target duration per scene (default: 6s)
 */
export function groupFramesIntoScenes(
  frames: ExtractedFrame[],
  sceneDurationSeconds = 6
): SceneSegment[] {
  if (frames.length === 0) return [];

  const segments: SceneSegment[] = [];
  let currentScene: ExtractedFrame[] = [];
  let sceneStart = frames[0]?.timestampSeconds ?? 0;

  for (const frame of frames) {
    currentScene.push(frame);

    const sceneDuration = frame.timestampSeconds - sceneStart;
    if (sceneDuration >= sceneDurationSeconds) {
      segments.push(buildSegment(currentScene, sceneStart));
      sceneStart = frame.timestampSeconds;
      currentScene = [];
    }
  }

  // Flush remaining frames as the last scene
  if (currentScene.length > 0) {
    segments.push(buildSegment(currentScene, sceneStart));
  }

  return segments;
}

function buildSegment(
  frames: ExtractedFrame[],
  startSeconds: number
): SceneSegment {
  const lastFrame = frames[frames.length - 1];
  const endSeconds = lastFrame?.timestampSeconds ?? startSeconds;
  const midIndex = Math.floor(frames.length / 2);
  const keyFrame = frames[midIndex] ?? frames[0];

  return {
    startSeconds,
    endSeconds: endSeconds + 2, // add interval offset for end boundary
    frames,
    keyFrame: keyFrame as ExtractedFrame,
  };
}
