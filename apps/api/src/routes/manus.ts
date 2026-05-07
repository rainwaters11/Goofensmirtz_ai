import { Router } from "express";
import { createManusProject } from "../lib/manus.js";

const router = Router();

// ─── POST /api/manus ──────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  try {
    const { name, instruction } = req.body as { name?: string; instruction?: string };

    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (!instruction?.trim()) {
      res.status(400).json({ error: "instruction is required" });
      return;
    }

    const project = await createManusProject({ name: name.trim(), instruction: instruction.trim() });
    res.json(project);
  } catch (err) {
    console.error("[manus] Error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create Manus project",
    });
  }
});

export { router as manusRouter };
