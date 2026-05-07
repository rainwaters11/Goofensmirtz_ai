"use client";

import { useState, useEffect } from "react";
import { Settings2, Key, User, Save, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "../../components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PersonaSelector } from "../../components/persona/persona-selector";

// ─── localStorage key constants ───────────────────────────────────────────────

const LS_PET_NAME_KEY = "pet_pov:settings:pet_name";
const LS_DEFAULT_PERSONA_KEY = "pet_pov:settings:default_persona_id";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved";

/**
 * SettingsPage — API provider config, pet profile, and pipeline preferences.
 *
 * Pet name and default persona are persisted to localStorage so they survive
 * page refreshes without requiring a Supabase user-preferences table.
 * When Supabase Auth is fully wired, these values should be migrated to the
 * `pets` table via the API.
 *
 * TODO: Migrate localStorage settings to Supabase `pets` table once auth is live.
 * TODO: Add key-validation feedback for API fields.
 */
export default function SettingsPage() {
  // ── Pet profile state ──────────────────────────────────────────────────────
  const [petName, setPetName] = useState("");
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // ── Load persisted values on mount ────────────────────────────────────────
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(LS_PET_NAME_KEY);
      const savedPersona = localStorage.getItem(LS_DEFAULT_PERSONA_KEY);
      if (savedName) setPetName(savedName);
      if (savedPersona) setDefaultPersonaId(savedPersona);
    } catch {
      // localStorage may be unavailable in some environments — fail silently
    }
  }, []);

  // ── Save handler ──────────────────────────────────────────────────────────
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      if (petName.trim()) {
        localStorage.setItem(LS_PET_NAME_KEY, petName.trim());
      } else {
        localStorage.removeItem(LS_PET_NAME_KEY);
      }

      if (defaultPersonaId) {
        localStorage.setItem(LS_DEFAULT_PERSONA_KEY, defaultPersonaId);
      } else {
        localStorage.removeItem(LS_DEFAULT_PERSONA_KEY);
      }

      setSaveStatus("saved");
      // Reset to idle after 2 s
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Settings"
        description="Manage your pet profile, API providers, and pipeline preferences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Pet Profile ──────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Pet profile
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Set your pet&apos;s name and default narration persona. These are
              saved locally and pre-filled on every new upload.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Pet name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="pet-name"
                  className="text-sm font-medium text-foreground"
                >
                  Pet name
                </label>
                <Input
                  id="pet-name"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="e.g. Biscuit, Goofinsmirtz, Mr. Whiskers…"
                  className="max-w-sm"
                />
              </div>

              {/* Default persona */}
              <PersonaSelector
                value={defaultPersonaId}
                onChange={setDefaultPersonaId}
              />

              {/* Save button */}
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-2 rounded-xl"
                >
                  {saveStatus === "saved" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {saveStatus === "saving" ? "Saving…" : "Save settings"}
                    </>
                  )}
                </Button>
                {saveStatus === "saved" && (
                  <p className="text-sm text-emerald-600">
                    Settings saved to your browser.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── API Providers ────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              API providers
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {API_PROVIDERS.map(({ label, envKey }) => (
              <div key={envKey} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  {label}
                </label>
                <input
                  type="password"
                  placeholder={`Set via ${envKey}`}
                  disabled
                  className="flex h-10 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Set <code className="font-mono">{envKey}</code> in your{" "}
                  <code className="font-mono">.env.local</code> file.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Pipeline Config ──────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" />
              Pipeline config
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              {/* TODO: Allow per-project default overrides (scene interval, model, etc.) */}
              Pipeline configuration options coming soon.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const API_PROVIDERS = [
  { label: "OpenAI",        envKey: "OPENAI_API_KEY" },
  { label: "Google Gemini", envKey: "GEMINI_API_KEY" },
  { label: "TTS provider",  envKey: "TTS_API_KEY" },
  { label: "Cloudinary",    envKey: "CLOUDINARY_URL" },
] as const;
