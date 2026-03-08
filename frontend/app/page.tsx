"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TextInput from "@/components/TextInput";

export default function HomePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleGenerate(text: string, title?: string) {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    // Animate progress while waiting
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        return p + Math.random() * 8;
      });
    }, 600);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error: ${res.status}`);
      }

      setProgress(100);
      const data = await res.json();
      router.push(`/storyboard/${data.storyboard_id}`);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-14 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight">
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Turn articles into
          </span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            visual storyboards
          </span>
        </h1>
        <p className="text-lg text-white/60 max-w-xl mx-auto">
          Paste any blog post, article, or script. Reelcraft transforms it into a
          scene-by-scene storyboard with AI-generated illustrations and narration.
        </p>
      </div>

      {/* Input */}
      <div className="animate-slide-up">
        <TextInput onGenerate={handleGenerate} isLoading={isGenerating} />
      </div>

      {/* Progress */}
      {isGenerating && (
        <div className="mt-8 animate-fade-in">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/80">Generating storyboard...</span>
              <span className="text-sm text-violet-400 font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {["Analyzing content", "Crafting scenes", "Generating art"].map((step, i) => (
                <div
                  key={step}
                  className={`text-xs py-2 px-3 rounded-lg transition-all ${
                    progress > i * 33
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Features */}
      {!isGenerating && (
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
          {[
            {
              icon: "🎨",
              title: "AI Illustrations",
              desc: "Each scene gets a unique illustration generated from your content.",
            },
            {
              icon: "📝",
              title: "Scene Scripts",
              desc: "Clean narration scripts for each scene, ready for voice-over.",
            },
            {
              icon: "⏱",
              title: "Timed Scenes",
              desc: "Automatic timing suggestions to pace your video perfectly.",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6 text-center hover:bg-white/8 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
