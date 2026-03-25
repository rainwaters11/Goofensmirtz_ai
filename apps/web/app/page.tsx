import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-8 py-16 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight">
        🐾 Pet POV AI
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Transform raw pet camera footage into narrated, personality-driven
        short-form videos — powered by AI.
      </p>

      <div className="flex gap-4">
        <Link
          href="/upload"
          className="rounded-lg bg-brand px-6 py-3 text-white font-semibold hover:bg-brand/90 transition-colors"
        >
          Upload Video
        </Link>
        <a
          href="https://github.com/rainwaters11/Goofensmirtz_ai"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border px-6 py-3 font-semibold hover:bg-accent transition-colors"
        >
          GitHub
        </a>
      </div>

      <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left w-full max-w-3xl">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border p-6">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const FEATURES = [
  {
    icon: "🎥",
    title: "Upload Footage",
    description:
      "Upload any raw pet POV video. We handle encoding, storage, and scene detection automatically.",
  },
  {
    icon: "🧠",
    title: "AI Scene Analysis",
    description:
      "Gemini Vision extracts structured events from every scene — who, what, where, and why.",
  },
  {
    icon: "🎙️",
    title: "Persona Narration",
    description:
      "Choose a pet persona (Dramatic Dog, Chill Cat…) and get a hilarious voiceover script.",
  },
];
