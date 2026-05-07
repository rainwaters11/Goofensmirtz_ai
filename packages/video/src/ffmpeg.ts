import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import fs from "node:fs/promises";

// Honor FFMPEG_PATH env var so constrained environments (Modal, Railway, Docker)
// can point to a specific binary rather than relying on $PATH.
if (process.env["FFMPEG_PATH"]) {
  ffmpeg.setFfmpegPath(process.env["FFMPEG_PATH"]);
}

export interface ExtractedFrame {
  /** Absolute path to the extracted JPEG file */
  filePath: string;
  /** Timestamp within the source video in seconds */
  timestampSeconds: number;
}

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

/**
 * Probe a video file and return its metadata.
 */
export async function probeVideo(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) return reject(new Error(`ffprobe failed: ${err.message}`));

      const videoStream = data.streams.find((s) => s.codec_type === "video");
      if (!videoStream) return reject(new Error("No video stream found"));

      const [fpsNum, fpsDen] = (videoStream.r_frame_rate ?? "30/1")
        .split("/")
        .map(Number) as [number, number];

      resolve({
        durationSeconds: data.format.duration ?? 0,
        width: videoStream.width ?? 0,
        height: videoStream.height ?? 0,
        fps: fpsNum / fpsDen,
        codec: videoStream.codec_name ?? "unknown",
      });
    });
  });
}

/**
 * Extract frames from a video at a given interval.
 * Frames are saved as JPEG files in the specified output directory.
 *
 * @param videoPath - Path to the source video file
 * @param outputDir - Directory to save extracted frames
 * @param intervalSeconds - How often to extract a frame (default: 2s)
 */
export async function extractFrames(
  videoPath: string,
  outputDir: string,
  intervalSeconds = 2
): Promise<ExtractedFrame[]> {
  await fs.mkdir(outputDir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=1/${intervalSeconds}`,
        "-q:v 2",
      ])
      .output(path.join(outputDir, "frame-%04d.jpg"))
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(new Error(`FFmpeg failed: ${err.message}`)))
      .run();
  });

  const files = await fs.readdir(outputDir);
  const frameFiles = files
    .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg"))
    .sort();

  return frameFiles.map((file, index) => ({
    filePath: path.join(outputDir, file),
    timestampSeconds: index * intervalSeconds,
  }));
}

/**
 * Merge a video file with an audio track to produce a final output video.
 * The output duration matches the video (shortest flag), so a long voiceover
 * won't extend beyond the original footage.
 *
 * @param videoPath - Path to the silent or original video
 * @param audioPath - Path to the voiceover audio file (MP3/WAV)
 * @param outputPath - Destination path for the rendered video
 */
export async function mergeAudioWithVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-map 0:v:0",   // video stream from first input
        "-map 1:a:0",   // audio stream from second input
        "-c:v copy",    // copy video codec — no re-encode, fast
        "-c:a aac",     // encode audio to AAC for broad MP4 compatibility
        "-b:a 192k",
        "-shortest",    // clip to the shorter of video/audio
        "-movflags +faststart", // place moov atom at front for streaming
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) =>
        reject(new Error(`mergeAudioWithVideo failed: ${err.message}`))
      )
      .run();
  });
}
