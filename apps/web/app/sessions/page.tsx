import { redirect } from "next/navigation";

/**
 * /sessions — redirect to the main dashboard.
 * The root page handles routing to Memory Feed or Onboarding based on auth state.
 */
export default function SessionsPage() {
  redirect("/");
}

