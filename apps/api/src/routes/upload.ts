import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { getSupabaseServiceClient, createVideo } from "@pet-pov/db";
import { z } from "zod";

const router = Router();

// Use memory storage; stream directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const UploadBodySchema = z.object({
  title: z.string().min(1).max(200),
  owner_id: z.string().uuid(),
});

/**
 * POST /api/upload
 *
 * Accepts a multipart video file, stores it in Cloudinary,
 * and creates a video record in the database.
 *
 * Returns: { videoId, cloudinaryUrl, publicId }
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

    // TODO: Upload req.file.buffer to Cloudinary using upload_stream
    // const cloudinaryResult = await new Promise((resolve, reject) => { ... });

    // TODO: Create the video record in Supabase
    // const db = getSupabaseServiceClient();
    // const video = await createVideo(db, { ... });

    // Placeholder response until upload logic is implemented
    res.status(201).json({
      message: "Upload endpoint ready — implementation pending",
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

export { router as uploadRouter };
