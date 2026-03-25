import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pet POV AI",
  description: "Transform your pet footage into narrated short-form videos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <header className="border-b">
          <div className="container mx-auto flex h-14 items-center px-4">
            <span className="text-xl font-bold text-brand">🐾 Pet POV AI</span>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
