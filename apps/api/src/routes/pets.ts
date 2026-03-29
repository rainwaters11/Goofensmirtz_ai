/**
 * pets.ts — API routes for pet management
 *
 * POST /api/pets/generate-avatar
 *   Accepts: { originalImageUrl, userId, petId }
 *   Pipeline:
 *     1. Vision pass — Gemini describes the pet from the photo
 *     2. Generation pass — Gemini Imagen (or fallback to SVG placeholder) creates
 *        a stylized 3D avatar character
 *     3. Uploads the generated image to Supabase Storage (avatars/{userId}/persona_{ts}.png)
 *     4. Updates pets.persona_avatar_url in the database
 *   Returns: { personaAvatarUrl }
 */

import { Router, type Request, type Response } from "express";
import { getSupabaseServiceClient } from "@pet-pov/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// ── Supabase service-role client (server-side only) ───────────────────────────
const supabase = getSupabaseServiceClient();

// ── Gemini client ─────────────────────────────────────────────────────────────
const genai = process.env["GEMINI_API_KEY"]
  ? new GoogleGenerativeAI(process.env["GEMINI_API_KEY"])
  : null;

// ── POST /api/pets/generate-avatar ────────────────────────────────────────────

router.post(
  "/generate-avatar",
  async (req: Request, res: Response): Promise<void> => {
    const { originalImageUrl, userId, petId } = req.body as {
      originalImageUrl?: string;
      userId?: string;
      petId?: string;
    };

    if (!originalImageUrl || !userId || !petId) {
      res.status(400).json({ error: "originalImageUrl, userId, and petId are required" });
      return;
    }

    console.log(`[generate-avatar] Starting for pet ${petId}, user ${userId}`);

    try {
      // ── Step 1: Fetch the image bytes for Gemini Vision ──────────────────────
      // If it's a Supabase storage signed URL, download it; otherwise fetch from URL
      let imageData: { inlineData: { data: string; mimeType: string } } | null = null;

      try {
        const imgRes = await fetch(originalImageUrl);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
          imageData = {
            inlineData: {
              data: base64,
              mimeType: contentType,
            },
          };
        }
      } catch (fetchErr) {
        console.warn("[generate-avatar] Could not fetch image:", fetchErr);
      }

      // ── Step 2: Gemini Vision — describe the pet ─────────────────────────────
      let petDescription = "a cute, fluffy pet with expressive eyes and a warm personality";

      if (genai && imageData) {
        try {
          const visionModel = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
          const visionResult = await visionModel.generateContent([
            {
              text: "Describe this pet in exactly 2 sentences focusing on: breed/type, fur/feather color and texture, distinctive physical features (ear shape, tail, markings), and overall size. Be specific and evocative. Do not mention the photo quality or background.",
            },
            imageData,
          ]);

          const description = visionResult.response.text().trim();
          if (description) {
            petDescription = description;
            console.log(`[generate-avatar] Vision description: ${description.slice(0, 100)}…`);
          }
        } catch (visionErr) {
          console.warn("[generate-avatar] Vision pass failed, using fallback description:", visionErr);
        }
      }

      // ── Step 3: Generate the avatar ──────────────────────────────────────────
      // Gemini doesn't natively output images via the text API.
      // We generate a visually rich SVG avatar from the description as our
      // "stylized avatar" — it's deterministic, fast, and requires no extra API.
      // When DALL-E 3 or Imagen API access is provisioned, swap this out.
      const avatarSvg = buildPersonaSVG(petDescription, petId);
      const avatarBuffer = Buffer.from(avatarSvg, "utf-8");

      // ── Step 4: Upload to Supabase Storage ───────────────────────────────────
      const timestamp = Date.now();
      const storagePath = `${userId}/persona_${timestamp}.svg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, avatarBuffer, {
          contentType: "image/svg+xml",
          upsert: false,
        });

      if (uploadError) {
        console.error("[generate-avatar] Storage upload failed:", uploadError);
        res.status(500).json({ error: "Failed to upload avatar to storage" });
        return;
      }

      // ── Step 5: Get a 30-day signed URL ──────────────────────────────────────
      const { data: signedData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(uploadData.path, 60 * 60 * 24 * 30); // 30 days

      const personaAvatarUrl = signedData?.signedUrl ?? "";

      // ── Step 6: Update pets table ─────────────────────────────────────────────
      const { error: updateError } = await supabase
        .from("pets")
        .update({
          persona_avatar_url: personaAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", petId);

      if (updateError) {
        console.warn("[generate-avatar] DB update failed:", updateError);
        // Non-fatal — return the URL anyway so the frontend can cache it
      }

      console.log(`[generate-avatar] ✅ Done for pet ${petId}`);
      res.json({ personaAvatarUrl, petDescription });
    } catch (err) {
      console.error("[generate-avatar] Unexpected error:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Avatar generation failed",
      });
    }
  }
);

export const petsRouter = router;

// ── SVG avatar builder ────────────────────────────────────────────────────────
// Generates a unique, deterministic SVG avatar character based on the pet
// description and petId. Uses a hash of the ID to pick colors and expression.

function buildPersonaSVG(description: string, petId: string): string {
  // Derive colors from petId hash
  const hash = petId.replace(/-/g, "").slice(0, 8);
  const hue = parseInt(hash.slice(0, 2), 16) % 360;
  const hue2 = (hue + 40) % 360;
  const eyeHue = (hue + 180) % 360;

  // Detect animal type from description
  const desc = description.toLowerCase();
  const isCat = desc.includes("cat") || desc.includes("feline") || desc.includes("kitten");
  const isBird = desc.includes("bird") || desc.includes("parrot") || desc.includes("feather");
  const isRabbit = desc.includes("rabbit") || desc.includes("bunny");

  // Ear shapes
  const ears = isCat
    ? `<polygon points="160,80 180,40 200,80" fill="hsl(${hue},60%,55%)"/>
       <polygon points="320,80 340,40 360,80" fill="hsl(${hue},60%,55%)"/>
       <polygon points="164,80 180,52 196,80" fill="hsl(${hue2},70%,80%)"/>
       <polygon points="324,80 340,52 356,80" fill="hsl(${hue2},70%,80%)"/>`
    : isRabbit
    ? `<ellipse cx="175" cy="55" rx="18" ry="42" fill="hsl(${hue},50%,60%)"/>
       <ellipse cx="345" cy="55" rx="18" ry="42" fill="hsl(${hue},50%,60%)"/>
       <ellipse cx="175" cy="55" rx="10" ry="34" fill="hsl(${hue2},70%,80%)"/>
       <ellipse cx="345" cy="55" rx="10" ry="34" fill="hsl(${hue2},70%,80%)"/>`
    : isBird
    ? `<ellipse cx="260" cy="72" rx="25" ry="15" fill="hsl(${hue},65%,45%)" transform="rotate(-20 260 72)"/>
       <ellipse cx="260" cy="68" rx="18" ry="10" fill="hsl(${hue2},70%,70%)" transform="rotate(-20 260 68)"/>`
    : `<ellipse cx="175" cy="90" rx="30" ry="22" fill="hsl(${hue},55%,50%)" transform="rotate(-15 175 90)"/>
       <ellipse cx="345" cy="90" rx="30" ry="22" fill="hsl(${hue},55%,50%)" transform="rotate(15 345 90)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="hsl(${hue},40%,92%)"/>
      <stop offset="100%" stop-color="hsl(${hue2},30%,82%)"/>
    </radialGradient>
    <radialGradient id="face" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="hsl(${hue},50%,75%)"/>
      <stop offset="100%" stop-color="hsl(${hue},55%,60%)"/>
    </radialGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background circle -->
  <circle cx="260" cy="260" r="250" fill="url(#bg)"/>

  <!-- Ears -->
  ${ears}

  <!-- Head -->
  <ellipse cx="260" cy="270" rx="130" ry="125" fill="url(#face)" filter="url(#shadow)"/>

  <!-- Eyes -->
  <ellipse cx="215" cy="240" rx="24" ry="26" fill="white"/>
  <ellipse cx="305" cy="240" rx="24" ry="26" fill="white"/>
  <circle cx="218" cy="242" r="16" fill="hsl(${eyeHue},60%,30%)"/>
  <circle cx="308" cy="242" r="16" fill="hsl(${eyeHue},60%,30%)"/>
  <circle cx="222" cy="238" r="6" fill="black"/>
  <circle cx="312" cy="238" r="6" fill="black"/>
  <circle cx="226" cy="235" r="3" fill="white"/>
  <circle cx="316" cy="235" r="3" fill="white"/>

  <!-- Nose -->
  <ellipse cx="260" cy="280" rx="12" ry="8" fill="hsl(${hue2},60%,40%)"/>

  <!-- Smile -->
  <path d="M 235 298 Q 260 318 285 298" stroke="hsl(${hue},40%,35%)" stroke-width="3" fill="none" stroke-linecap="round"/>

  <!-- Cheek blush -->
  <ellipse cx="188" cy="275" rx="20" ry="12" fill="hsl(${hue2},80%,70%)" opacity="0.4"/>
  <ellipse cx="332" cy="275" rx="20" ry="12" fill="hsl(${hue2},80%,70%)" opacity="0.4"/>

  <!-- Sparkle decoration -->
  <text x="80" y="120" font-size="32" opacity="0.6">✨</text>
  <text x="390" y="140" font-size="24" opacity="0.5">⭐</text>
</svg>`;
}
