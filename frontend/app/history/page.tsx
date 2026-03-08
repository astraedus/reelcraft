"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StoryboardSummary {
  id: string;
  title: string;
  scene_count: number;
  total_duration_seconds: number;
  created_at: number;
}

export default function HistoryPage() {
  const [storyboards, setStoryboards] = useState<StoryboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/storyboards")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load history");
        return r.json();
      })
      .then((data) => {
        setStoryboards(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Storyboard History</h1>
          <p className="text-white/50 mt-1">Your previously generated storyboards</p>
        </div>
        <Link href="/" className="btn-primary text-sm">
          New Storyboard
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && storyboards.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold text-white/80 mb-2">No storyboards yet</h2>
          <p className="text-white/50 mb-6">Generate your first storyboard to see it here.</p>
          <Link href="/" className="btn-primary">
            Get Started
          </Link>
        </div>
      )}

      {!loading && storyboards.length > 0 && (
        <div className="grid gap-4">
          {storyboards.map((sb) => (
            <Link
              key={sb.id}
              href={`/storyboard/${sb.id}`}
              className="card p-6 hover:bg-white/8 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                    {sb.title}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">{formatDate(sb.created_at)}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0 text-sm text-white/50">
                  <div className="text-center">
                    <div className="font-semibold text-white">{sb.scene_count}</div>
                    <div>scenes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-white">{formatDuration(sb.total_duration_seconds)}</div>
                    <div>duration</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/30 transition-colors">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
