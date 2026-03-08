"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Timeline from "@/components/Timeline";
import SceneCard from "@/components/SceneCard";

interface Scene {
  index: number;
  script: string;
  timing_seconds: number;
  image_base64: string | null;
}

interface Storyboard {
  id: string;
  title: string;
  input_text: string;
  scenes: Scene[];
  created_at: number;
  total_duration_seconds: number;
}

export default function StoryboardPage() {
  const params = useParams();
  const id = params.id as string;

  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/storyboards/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Storyboard not found");
        return r.json();
      })
      .then((data) => {
        setStoryboard(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  async function handleExportPDF() {
    if (!storyboard) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i];
        if (i > 0) doc.addPage();

        // Background
        doc.setFillColor(15, 15, 30);
        doc.rect(0, 0, pageW, pageH, "F");

        // Scene number
        doc.setFontSize(10);
        doc.setTextColor(139, 92, 246);
        doc.text(`SCENE ${i + 1} / ${storyboard.scenes.length}`, 10, 10);

        // Image
        if (scene.image_base64) {
          try {
            doc.addImage(
              `data:image/png;base64,${scene.image_base64}`,
              "PNG",
              10,
              15,
              150,
              84
            );
          } catch (_) {
            // Image failed — skip
          }
        }

        // Script
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        const lines = doc.splitTextToSize(scene.script, 120);
        doc.text(lines, 168, 25);

        // Timing
        doc.setFontSize(9);
        doc.setTextColor(160, 160, 160);
        doc.text(`Duration: ${scene.timing_seconds}s`, 168, pageH - 15);
      }

      doc.save(`${storyboard.title.slice(0, 40)}-storyboard.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  }

  function handleDownloadImages() {
    if (!storyboard) return;
    storyboard.scenes.forEach((scene, i) => {
      if (!scene.image_base64) return;
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${scene.image_base64}`;
      link.download = `scene-${i + 1}.png`;
      link.click();
    });
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading storyboard...</p>
        </div>
      </div>
    );
  }

  if (error || !storyboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Storyboard not found"}</p>
          <Link href="/" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-white/50 hover:text-white/80 text-sm transition-colors">
              Home
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white/50 text-sm">Storyboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white truncate">{storyboard.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
            <span>{storyboard.scenes.length} scenes</span>
            <span>Total: {formatDuration(storyboard.total_duration_seconds)}</span>
            <span>{new Date(storyboard.created_at * 1000).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={handleDownloadImages} className="btn-secondary text-sm">
            Download Images
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-primary text-sm"
          >
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <Timeline
          scenes={storyboard.scenes}
          activeScene={activeScene}
          onSceneSelect={setActiveScene}
        />
      </div>

      {/* Active scene (large) */}
      <div className="mb-8">
        <SceneCard scene={storyboard.scenes[activeScene]} featured />
      </div>

      {/* All scenes grid */}
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-4">All Scenes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyboard.scenes.map((scene, i) => (
            <div
              key={scene.index}
              onClick={() => setActiveScene(i)}
              className={`cursor-pointer transition-all ${
                activeScene === i ? "ring-2 ring-violet-500 rounded-2xl" : ""
              }`}
            >
              <SceneCard scene={scene} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
