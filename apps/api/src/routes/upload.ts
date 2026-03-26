import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { getSupabaseServiceClient, createSession } from "@pet-pov/db";
import { z } from "zod";

const router = Router();

// Use memory storage; stream directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// Configure Cloudinary from env (CLOUDINARY_URL takes priority over named vars)
if (process.env["CLOUDINARY_URL"]) {
  cloudinary.config({ cloudinary_url: process.env["CLOUDINARY_URL"] });
} else if (
  process.env["CLOUDINARY_CLOUD_NAME"] &&
  process.env["CLOUDINARY_API_KEY"] &&
  process.env["CLOUDINARY_API_SECRET"]
) {
  cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
  });
}

const UploadBodySchema = z.object({
  title: z.string().min(1).max(200),
  // For demo: owner_id is optional — defaults to a demo owner UUID
  owner_id: z.string().uuid().optional().default("00000000-0000-0000-0000-000000000001"),
  pet_id: z.string().uuid().optional(),
});

/**
 * POST /api/upload
 *
 * Accepts a multipart video file, stores it in Cloudinary,
 * and creates a Session record in Supabase.
 *
 * INPUT:
 *   - multipart field "video": raw video file (≤ 500 MB)
 *   - body.title: human-readable session title
 *   - body.owner_id: (optional) user UUID — defaults to demo owner
 *   - body.pet_id: (optional) UUID of the pet this session belongs to
 *
 * OUTPUT:
 *   - 201 { sessionId, cloudinaryUrl, publicId, thumbnailUrl }
 */
router.post("/", upload.single("video"), async (req, res, next) => {
  try {
    const body = UploadBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No video file provided" });
      return;
    }

    // ── 1. Upload to Cloudinary ───────────────────────────────────────────────
    const cloudinaryResult = await new Promise<{
      secure_url: string;
      public_id: string;
      duration: number;
      thumbnail_url?: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "pet-pov/sessions",
          // Auto-generate a thumbnail at 3 seconds
          eager: [{ width: 640, height: 360, crop: "fill", format: "jpg", start_offset: "3" }],
          eager_async: false,
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            duration: result.duration ?? 0,
            thumbnail_url: result.eager?.[0]?.secure_url,
          });
        }
      );
      stream.end(req.file!.buffer);
    });

    console.log(`[upload] Cloudinary upload complete: ${cloudinaryResult.public_id}`);

    // ── 2. Create Session record in Supabase ──────────────────────────────────
    const db = getSupabaseServiceClient();
    const session = await createSession(db, {
      owner_id: body.data.owner_id,
      pet_id: body.data.pet_id ?? null,
      title: body.data.title,
      video_url: cloudinaryResult.secure_url,
      cloudinary_public_id: cloudinaryResult.public_id,
      thumbnail_url: cloudinaryResult.thumbnail_url ?? null,
      rendered_video_url: null,
      audio_url: null,
      duration_seconds: cloudinaryResult.duration ?? null,
      status: "uploaded",
      modes_run: [],
    });

    console.log(`[upload] Session created: ${session.id}`);

    // ── 3. Return result ──────────────────────────────────────────────────────
    res.status(201).json({
      sessionId: session.id,
      cloudinaryUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      thumbnailUrl: cloudinaryResult.thumbnail_url ?? null,
      durationSeconds: cloudinaryResult.duration,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    next(err);
  }
});

export { router as uploadRouter };
