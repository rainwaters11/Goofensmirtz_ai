import { redirect } from "next/navigation";

/**
 * /sessions — redirect to the dashboard which is the canonical sessions list.
 * This prevents the Next.js 15 "missing required error components" error
 * that occurs when a directory exists (for [id]) but has no page.tsx.
 */
export default function SessionsPage() {
  redirect("/");
}
