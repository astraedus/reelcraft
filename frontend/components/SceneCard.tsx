"use client";

interface Scene {
  index: number;
  script: string;
  timing_seconds: number;
  image_base64: string | null;
}

interface SceneCardProps {
  scene: Scene;
  featured?: boolean;
}

export default function SceneCard({ scene, featured = false }: SceneCardProps) {
  const imageUrl = scene.image_base64
    ? `data:image/png;base64,${scene.image_base64}`
    : null;

  return (
    <div className={`card overflow-hidden ${featured ? "animate-slide-up" : ""}`}>
      {/* Image */}
      <div
        className={`relative bg-gradient-to-br from-violet-900/40 to-indigo-900/40 ${
          featured ? "h-80" : "h-44"
        }`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Scene ${scene.index + 1} illustration`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className={`${featured ? "text-5xl" : "text-3xl"} mb-2 opacity-30`}>🎬</div>
              <p className="text-white/20 text-xs">No illustration</p>
            </div>
          </div>
        )}

        {/* Scene number badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white/90 text-xs font-mono px-2 py-1 rounded-md">
          {String(scene.index + 1).padStart(2, "0")}
        </div>

        {/* Timing badge */}
        <div className="absolute top-3 right-3 bg-violet-500/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md">
          {scene.timing_seconds}s
        </div>
      </div>

      {/* Script */}
      <div className={`p-4 ${featured ? "p-6" : ""}`}>
        <p
          className={`text-white/80 leading-relaxed ${
            featured ? "text-base" : "text-sm line-clamp-4"
          }`}
        >
          {scene.script}
        </p>
        {featured && (
          <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
              Scene {scene.index + 1}
            </span>
            <span>{scene.timing_seconds} seconds</span>
          </div>
        )}
      </div>
    </div>
  );
}
