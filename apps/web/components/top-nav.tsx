"use client";

import { Bell, Menu, LogOut } from "lucide-react";
import Image from "next/image";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { useUser } from "../lib/supabase/use-user";
import { createClient } from "../lib/supabase/client";

interface TopNavProps {
  onMenuToggle?: () => void;
  className?: string;
}

export function TopNav({ onMenuToggle, className }: TopNavProps) {
  const user = useUser();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Redirect to login page after sign-out
    window.location.href = "/auth/login";
  }

  // Derive initials from the user's name or email for the fallback avatar
  const initials = user?.user_metadata?.["full_name"]
    ? (user.user_metadata["full_name"] as string)
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const avatarUrl: string | null =
    (user?.user_metadata?.["avatar_url"] as string | undefined) ?? null;

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

        {/* User avatar — shows Google profile photo when available */}
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={user?.user_metadata?.["full_name"] as string ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-border"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold select-none"
            aria-label="User avatar"
          >
            {initials}
          </div>
        )}

        {/* Sign-out button — only shown when a user is authenticated */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
