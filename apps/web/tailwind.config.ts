import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        brand: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border:  "hsl(var(--border))",
        input:   "hsl(var(--input))",
        ring:    "hsl(var(--ring))",

        sidebar: {
          DEFAULT:    "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted:      "hsl(var(--sidebar-muted))",
          border:     "hsl(var(--sidebar-border))",
          accent:     "hsl(var(--sidebar-accent))",
        },
      },

      borderRadius: {
        "2xl": "calc(var(--radius) + 4px)",
        xl:    "var(--radius)",
        lg:    "calc(var(--radius) - 2px)",
        md:    "calc(var(--radius) - 4px)",
        sm:    "calc(var(--radius) - 6px)",
      },

      boxShadow: {
        card:  "0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)",
        panel: "0 4px 16px -2px rgba(0,0,0,.08), 0 2px 6px -2px rgba(0,0,0,.06)",
        lift:  "0 8px 24px -4px rgba(0,0,0,.10), 0 4px 8px -4px rgba(0,0,0,.06)",
        glow:  "0 0 0 3px rgba(249,115,22,.15), 0 4px 16px -2px rgba(249,115,22,.20)",
        "glow-sm": "0 0 0 2px rgba(249,115,22,.12), 0 2px 8px -2px rgba(249,115,22,.15)",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "ui-sans-serif", "sans-serif"],
      },

      transitionDuration: {
        "200": "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
