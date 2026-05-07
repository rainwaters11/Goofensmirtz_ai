"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Theater,
  Settings,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Separator } from "./ui/separator";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/sessions",  label: "Sessions",   icon: FolderOpen },
  { href: "/upload",    label: "Upload",     icon: Upload },
  { href: "/personas",  label: "Personas",   icon: Theater },
  { href: "/settings",  label: "Settings",   icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
      {/* ── Logo ──────────────────────────────────── */}
      <Link href="/" className="flex h-20 items-center gap-2.5 px-3">
        <Image
          src="/logo-icon.png"
          alt="Pet POV AI icon"
          width={88}
          height={88}
          className="object-contain shrink-0"
          style={{ filter: "drop-shadow(0 2px 8px rgba(249,115,22,0.4))" }}
          priority
        />
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "#f97316",
          textTransform: "uppercase" as const,
          whiteSpace: "nowrap" as const,
        }}>
          Pet POV AI
        </span>
      </Link>

      <Separator className="bg-sidebar-border" />

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────── */}
      <Separator className="bg-sidebar-border" />
      <div className="px-5 py-4">
        <p className="text-xs text-sidebar-muted">Pet POV AI · v0.1.0</p>
      </div>
    </aside>
  );
}
