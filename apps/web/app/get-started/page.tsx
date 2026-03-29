"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, ArrowRight, Star } from "lucide-react";

interface PetProfile {
  name: string;
  personaName: string;
  personaEmoji: string;
}

export default function GetStartedPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PetProfile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("pet-profile");
    if (raw) {
      try {
        setProfile(JSON.parse(raw) as PetProfile);
      } catch {
        // ignore
      }
    }
  }, []);

  const petName = profile?.name ?? "your pet";
  const personaName = profile?.personaName ?? "their personality";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
          {profile?.personaEmoji && (
            <span>{profile.personaEmoji}</span>
          )}
          {petName} is ready
        </div>
        <h1 className="text-3xl font-black text-foreground">
          How do you want to start?
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          You can upload your own video — or explore the demo to see{" "}
          <strong className="text-foreground">{personaName}</strong> in action.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Card A: Upload */}
        <button
          onClick={() => router.push("/upload")}
          className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-primary/20 bg-white p-7 text-left shadow-sm hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-200 active:scale-[0.98]"
        >
          {/* Recommended badge */}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            <Star className="h-2.5 w-2.5 fill-primary" />
            Recommended
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-400/30">
            <Upload className="h-5 w-5" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">
              Upload a Memory
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drop a 15–30 sec clip.{" "}
              <span className="font-medium text-foreground">{petName}</span>{" "}
              will narrate it in their own voice — verbatim chaos included.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
            Upload now <ArrowRight className="h-4 w-4" />
          </div>
        </button>

        {/* Card B: Demo */}
        <button
          onClick={() => router.push("/sessions/demo-biscuit-tuesday")}
          className="group relative flex flex-col items-start gap-4 rounded-2xl border-2 border-border bg-white p-7 text-left shadow-sm hover:border-slate-400 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          {/* No video badge */}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            No upload needed
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-md shadow-purple-400/30">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">
              See the Magic First
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Watch a demo session—no upload needed. See exactly how{" "}
              <span className="font-medium text-foreground">{petName}</span>{" "}
              would narrate and react to real pet footage.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 group-hover:gap-2.5 transition-all">
            Try the demo <ArrowRight className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Skip link */}
      <button
        onClick={() => router.push("/")}
        className="mt-8 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Go to dashboard instead →
      </button>
    </div>
  );
}
