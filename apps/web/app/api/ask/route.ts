import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * POST /api/ask — Proxy to Express API for Ask My Pet.
 * Avoids CORS issues by routing through the Next.js server.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Next.js /api/ask] proxy error:", error);
    return NextResponse.json(
      { error: "Failed to reach API server" },
      { status: 502 }
    );
  }
}
