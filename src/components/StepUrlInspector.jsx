import { useState } from "react";
import { inspectUrl, ApiError } from "../services/api";

const MODE_COLORS = {
  TOHODO: "bg-blue-600",
  QUICKFORM: "bg-purple-600",
  LIGHTNING: "bg-amber-600",
  DIRECT: "bg-green-600",
};

export default function StepUrlInspector({ baseUrl, onInspected, onSkip }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await inspectUrl(url.trim(), { baseUrl });
      onInspected({
        url: result.finalUrl || url.trim(),
        recommendedMode: result.recommendedMode,
        reason: result.reason,
        detectedFields: result.detectedFields || [],
        warning: result.warning,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to inspect URL.");
      console.error("Inspect error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Step 1: Target Form URL</h2>
        <p className="text-sm text-slate-400 mb-4">
          Paste the web form URL to analyze its structure and recommend the best autofill mode.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="url"
            placeholder="https://example.com/form"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 font-semibold py-3 px-6 rounded transition"
            >
              {loading ? "Analyzing..." : "Analyze Form"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 px-6 py-3 rounded transition text-sm"
            >
              Skip
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">Mode Detection Examples:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(MODE_COLORS).map(([mode, color]) => (
              <div key={mode} className="flex items-center gap-2">
                <span className={`${color} w-3 h-3 rounded-full`} />
                <span className="text-slate-400">{mode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
