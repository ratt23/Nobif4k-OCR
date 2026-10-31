import { useState } from "react";
import { inspectUrl, ApiError } from "../services/api";

const MODES_INFO = [
  { mode: "TOHODO", label: "Google Forms", color: "from-blue-500 to-indigo-600", dot: "bg-blue-400" },
  { mode: "QUICKFORM", label: "Standard HTML Form", color: "from-purple-500 to-pink-600", dot: "bg-purple-400" },
  { mode: "LIGHTNING", label: "React / Modern SPA", color: "from-amber-500 to-orange-600", dot: "bg-amber-400" },
  { mode: "DIRECT", label: "Direct Universal Inject", color: "from-emerald-500 to-teal-600", dot: "bg-emerald-400" },
];

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
      setError(err instanceof ApiError ? err.message : "Gagal memeriksa form target URL.");
      console.error("Inspect error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 border border-slate-700/70 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
          <h2 className="text-xl font-bold tracking-tight text-white">Inspeksi Form Target</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Masukkan URL formulir web tujuan (misal: formulir pendaftaran, SIMRS, Google Forms, atau sistem rumah sakit) untuk mendeteksi field input dan menentukan mode autofill paling presisi.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="url"
              placeholder="https://docs.google.com/forms/d/e/... atau https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner font-mono"
              disabled={loading}
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 text-xs text-red-200 flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"></div>
                  Menganalisis Form...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Analisis Struktur Form
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="py-3 px-5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              Lewati (Mode Langsung) ➔
            </button>
          </div>
        </form>

        {/* Mode Information Cards */}
        <div className="pt-4 border-t border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2.5">
            Mendukung Otomasi Multi-Mode:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {MODES_INFO.map((item) => (
              <div key={item.mode} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
                <div>
                  <span className="font-bold text-slate-200">{item.mode}</span>
                  <span className="text-[10px] text-slate-400 block">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
