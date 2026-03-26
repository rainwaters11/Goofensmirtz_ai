import { Settings2, Key, User } from "lucide-react";
import { SectionHeader } from "../../components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

/**
 * SettingsPage — API provider config and account placeholders.
 *
 * TODO: Connect each section to real settings storage (Supabase user preferences).
 * TODO: Add key-validation feedback for API fields.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Settings"
        description="Manage API providers and account preferences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── API Providers ────────────────────── */}
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
                {/* TODO: Implement settings storage — currently env-variable only */}
                <p className="text-xs text-muted-foreground">
                  Set <code className="font-mono">{envKey}</code> in your{" "}
                  <code className="font-mono">.env.local</code> file.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Account ──────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              {/* TODO: Integrate Supabase Auth for user accounts */}
              Account management will be available after authentication is
              integrated.
            </div>
          </CardContent>
        </Card>

        {/* ── Pipeline Config ──────────────────── */}
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

const API_PROVIDERS = [
  { label: "OpenAI",     envKey: "OPENAI_API_KEY" },
  { label: "Google Gemini", envKey: "GEMINI_API_KEY" },
  { label: "TTS provider",  envKey: "TTS_API_KEY" },
  { label: "Cloudinary",    envKey: "CLOUDINARY_URL" },
] as const;
