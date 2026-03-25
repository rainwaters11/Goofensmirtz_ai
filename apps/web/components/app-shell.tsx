"use client";

import { useState } from "react";
import { cn } from "../lib/utils";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — the root layout shell for all authenticated pages.
 *
 * Renders a fixed sidebar (desktop) + collapsible overlay (mobile) alongside
 * a top navigation bar. All page content is rendered inside `children`.
 *
 * This is a client component because sidebar-open state is managed here.
 * The parent layout.tsx remains a server component.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop sidebar ─────────────────────── */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ──────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 z-50 flex">
            <Sidebar />
          </div>
        </div>
      )}

      {/* ── Main content area ───────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "px-6 py-8 lg:px-8"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
