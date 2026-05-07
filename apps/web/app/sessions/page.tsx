import { redirect } from "next/navigation";

/**
 * /sessions — redirect to the demo session detail page.
 */
export default function SessionsPage() {
  redirect("/sessions/demo-biscuit-tuesday");
}
