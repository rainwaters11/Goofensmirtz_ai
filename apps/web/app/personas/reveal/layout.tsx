/**
 * /personas/reveal and /get-started use a full-screen layout (no sidebar).
 * This layout file opts those routes out of the AppShell wrapper.
 */
export default function FullScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
