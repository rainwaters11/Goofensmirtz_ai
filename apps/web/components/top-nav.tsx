"use client";

import { Bell, Menu } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface TopNavProps {
  onMenuToggle?: () => void;
  className?: string;
}

export function TopNav({ onMenuToggle, className }: TopNavProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background px-6",
        className
      )}
    >
      {/* ── Left: mobile hamburger ──────────────── */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Right: actions ─────────────────────── */}
      <div className="ml-auto flex items-center gap-3">
        {/* TODO: Wire up notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
        </Button>

        {/* TODO: Replace with real user avatar from auth session */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold select-none"
          aria-label="User avatar"
        >
          U
        </div>
      </div>
    </header>
  );
}
