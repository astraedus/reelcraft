"use client";

import { useState } from "react";

interface TextInputProps {
  onGenerate: (text: string, title?: string) => void;
  isLoading: boolean;
}

const PLACEHOLDER = `Paste your blog post, article, or script here...

For example:
"The history of jazz music spans over a century. Born in New Orleans in the early 1900s, jazz emerged from a fusion of African rhythms, blues, and European harmonies. Artists like Louis Armstrong and Duke Ellington shaped its early voice..."`;

export default function TextInput({ onGenerate, isLoading }: TextInputProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const charCount = text.length;
  const isValid = charCount >= 50 && charCount <= 20000;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isLoading) return;
    onGenerate(text.trim(), title.trim() || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card p-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={isLoading}
          className="w-full h-64 bg-transparent px-5 py-4 text-white/90 placeholder-white/25 resize-none
                     focus:outline-none text-sm leading-relaxed"
          maxLength={20000}
        />
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs ${
                charCount < 50
                  ? "text-white/30"
                  : charCount > 18000
                  ? "text-amber-400"
                  : "text-white/40"
              }`}
            >
              {charCount.toLocaleString()} / 20,000 chars
            </span>
            {charCount < 50 && charCount > 0 && (
              <span className="text-xs text-white/30">Need {50 - charCount} more characters</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setText("")}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Advanced options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
        >
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▶</span>
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-3 animate-slide-up">
            <label className="block text-sm text-white/60 mb-1">Custom title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The History of Jazz"
              maxLength={100}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/90
                         placeholder-white/25 focus:outline-none focus:border-violet-500/50 text-sm"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="btn-primary w-full py-4 text-base"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating storyboard...
          </span>
        ) : (
          "Generate Storyboard"
        )}
      </button>
    </form>
  );
}
