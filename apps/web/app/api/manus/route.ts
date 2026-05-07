import { NextRequest, NextResponse } from "next/server";
import { createManusProject } from "@/lib/manus";

// ── POST /api/manus ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; instruction?: string };
    const { name, instruction } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!instruction?.trim()) {
      return NextResponse.json(
        { error: "instruction is required" },
        { status: 400 }
      );
    }

    const project = await createManusProject({ name: name.trim(), instruction: instruction.trim() });

    return NextResponse.json(project);
  } catch (err) {
    console.error("[manus] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create Manus project" },
      { status: 500 }
    );
  }
}
