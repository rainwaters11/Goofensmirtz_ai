import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload.js";
import { processRouter } from "./routes/process.js";
import { narrateRouter } from "./routes/narrate.js";
import { voiceRouter } from "./routes/voice.js";
import { renderRouter } from "./routes/render.js";
import { askRouter } from "./routes/ask.js";

const app = express();
const PORT = process.env["PORT"] ?? 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env["NEXT_PUBLIC_APP_URL"] ?? "*" }));
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/upload", uploadRouter);
app.use("/api/process", processRouter);
app.use("/api/narrate", narrateRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/render", renderRouter);
// Ask My Pet mode — conversational Q&A against a session
app.use("/api/ask", askRouter);

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[API Error]", err);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Pet POV API running on http://localhost:${PORT}`);
});

export default app;
