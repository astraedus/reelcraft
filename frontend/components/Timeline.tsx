"use client";

interface Scene {
  index: number;
  script: string;
  timing_seconds: number;
  image_base64: string | null;
}

interface TimelineProps {
  scenes: Scene[];
  activeScene: number;
  onSceneSelect: (index: number) => void;
}

export default function Timeline({ scenes, activeScene, onSceneSelect }: TimelineProps) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.timing_seconds, 0);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Timeline</span>
        <span className="text-xs text-white/30">{scenes.length} scenes</span>
      </div>

      {/* Proportional timeline bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        {scenes.map((scene, i) => {
          const width = (scene.timing_seconds / totalDuration) * 100;
          const left = scenes
            .slice(0, i)
            .reduce((sum, s) => sum + (s.timing_seconds / totalDuration) * 100, 0);
          return (
            <button
              key={scene.index}
              onClick={() => onSceneSelect(i)}
              className={`absolute top-0 h-full transition-all ${
                activeScene === i
                  ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                  : "bg-white/20 hover:bg-white/30"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Scene ${i + 1}: ${scene.timing_seconds}s`}
            />
          );
        })}
      </div>

      {/* Scene thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {scenes.map((scene, i) => {
          const imageUrl = scene.image_base64
            ? `data:image/png;base64,${scene.image_base64}`
            : null;

          return (
            <button
              key={scene.index}
              onClick={() => onSceneSelect(i)}
              className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                activeScene === i
                  ? "border-violet-500 shadow-lg shadow-violet-500/25"
                  : "border-transparent hover:border-white/20"
              }`}
              style={{ width: 100, height: 56 }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={`Scene ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-indigo-900/50 flex items-center justify-center">
                  <span className="text-white/30 text-xs">S{i + 1}</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white/80 text-[10px] text-center py-0.5">
                {scene.timing_seconds}s
              </div>
              {activeScene === i && (
                <div className="absolute inset-0 bg-violet-500/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
