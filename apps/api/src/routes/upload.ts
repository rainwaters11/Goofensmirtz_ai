import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { getSupabaseServiceClient, createSession } from "@pet-pov/db";
import { z } from "zod";

const router = Router();

// Use memory storage; stream directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const UploadBodySchema = z.object({
  title: z.string().min(1).max(200),
  owner_id: z.string().uuid(),
  pet_id: z.string().uuid().optional(),
});

/**
 * POST /api/upload
 *
 * Accepts a multipart video file, stores it in Cloudinary,
 * and creates a Session record in the database.
 *
 * INPUT:
 *   - multipart field "video": the raw video file (≤ 500 MB)
 *   - body.title: human-readable session title (string)
 *   - body.owner_id: authenticated user UUID
 *   - body.pet_id: (optional) UUID of the pet this session belongs to
 *
 * OUTPUT:
 *   - 201 { sessionId, cloudinaryUrl, publicId }
 *
 * SERVICES:
 *   - Cloudinary: `cloudinary.uploader.upload_stream` (resource_type: "video")
 *     Reads from: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   - Supabase: `createSession()` from @pet-pov/db → writes to `sessions` table
 *     Reads from: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * STUBBED: Both the Cloudinary upload and the DB insert are commented out below.
 *   Uncomment and wire together to complete Phase 1 of the pipeline.
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

    // TODO [Phase 1]: Upload req.file.buffer to Cloudinary via upload_stream.
    //   INPUT:  req.file.buffer (Buffer), req.file.mimetype
    //   OUTPUT: cloudinaryResult.secure_url, cloudinaryResult.public_id, cloudinaryResult.duration
    //   SERVICE: cloudinary.uploader.upload_stream (resource_type: "video", folder: "pet-pov/sessions")
    //
    // const cloudinaryResult = await new Promise<{ secure_url: string; public_id: string; duration: number }>(
    //   (resolve, reject) => {
    //     const stream = cloudinary.uploader.upload_stream(
    //       { resource_type: "video", folder: "pet-pov/sessions" },
    //       (err, result) => (err ? reject(err) : resolve(result!))
    //     );
    //     stream.end(req.file!.buffer);
    //   }
    // );

    // TODO [Phase 1]: Create the Session record in Supabase.
    //   INPUT:  owner_id, pet_id (optional), title, cloudinaryResult values
    //   OUTPUT: Session object with session.id
    //   SERVICE: createSession() from @pet-pov/db → writes to `sessions` table
    //
    // const db = getSupabaseServiceClient();
    // const session = await createSession(db, {
    //   owner_id: body.data.owner_id,
    //   pet_id: body.data.pet_id ?? null,
    //   title: body.data.title,
    //   cloudinary_url: cloudinaryResult.secure_url,
    //   cloudinary_public_id: cloudinaryResult.public_id,
    //   duration_seconds: cloudinaryResult.duration ?? null,
    //   status: "uploaded",
    //   modes_run: [],
    // });

    // TODO [Phase 1]: Replace this stub response with the real one:
    // res.status(201).json({ sessionId: session.id, cloudinaryUrl: cloudinaryResult.secure_url, publicId: cloudinaryResult.public_id });

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
