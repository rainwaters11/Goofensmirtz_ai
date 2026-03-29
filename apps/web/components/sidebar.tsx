"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Theater,
  Settings,
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { href: "/",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/upload",   label: "Upload",     icon: Upload },
  { href: "/personas", label: "Personas",   icon: Theater },
  { href: "/settings", label: "Settings",   icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-60 flex-col"
      style={{
        background: "hsl(var(--sidebar))",
        borderRight: "2px solid hsl(var(--sidebar-border))",
        boxShadow: "4px 0 16px rgba(249,115,22,0.06)",
      }}
    >
      {/* ── Logo ──────────────────────────────────── */}
      <Link
        href="/"
        className="flex h-20 items-center gap-2.5 px-4 cursor-pointer"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden shrink-0"
          style={{
            background: "rgba(249,115,22,0.12)",
            border: "2px solid rgba(249,115,22,0.2)",
            boxShadow: "2px 2px 8px rgba(249,115,22,0.15)",
          }}
        >
          <Image
            src="/logo-icon.png"
            alt="Pet POV AI"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span
            style={{
              fontFamily: "var(--font-fredoka, 'Fredoka', sans-serif)",
              fontSize: 16,
              fontWeight: 700,
              color: "hsl(var(--primary))",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            Pet POV AI
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "hsl(var(--sidebar-muted))",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            AI Pet Narrator
          </span>
        </div>
      </Link>

      {/* ── Divider ────────────────────────────────── */}
      <div
        className="mx-4 mb-2"
        style={{ height: "1.5px", background: "hsl(var(--sidebar-border))" }}
      />

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                active
                  ? "text-primary"
                  : "hover:text-foreground"
              )}
              style={active ? {
                background: "rgba(249,115,22,0.12)",
                border: "2px solid rgba(249,115,22,0.2)",
                boxShadow: "3px 3px 10px rgba(249,115,22,0.1), -1px -1px 4px rgba(255,255,255,0.8)",
                color: "hsl(var(--primary))",
              } : {
                border: "2px solid transparent",
                color: "hsl(var(--sidebar-foreground))",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--sidebar-accent))";
                  (e.currentTarget as HTMLElement).style.border = "2px solid rgba(249,115,22,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "";
                  (e.currentTarget as HTMLElement).style.border = "2px solid transparent";
                }
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────── */}
      <div
        className="mx-4 mb-0 mt-auto"
        style={{ height: "1.5px", background: "hsl(var(--sidebar-border))" }}
      />
      <div className="px-4 py-4">
        <p
          className="text-xs"
          style={{ color: "hsl(var(--sidebar-muted))", fontWeight: 500 }}
        >
          Pet POV AI · v0.1.0
        </p>
      </div>
    </aside>
  );
}

