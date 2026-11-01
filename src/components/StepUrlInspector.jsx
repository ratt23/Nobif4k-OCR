import { useState } from "react";
import { inspectUrl, ApiError } from "../services/api";

const MODES_INFO = [
  { mode: "DIRECT", label: "Autofill Langsung Universal", desc: "Isi otomatis form apa pun atau salin teks" },
  { mode: "TOHODO", label: "Google Forms", desc: "Optimasi khusus field Google Form" },
  { mode: "QUICKFORM", label: "Standard HTML Form", desc: "Formulir standar web & intranet" },
  { mode: "LIGHTNING", label: "React / Modern SPA", desc: "Aplikasi Single Page modern (SIMRS, dll)" },
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
      setError(err instanceof ApiError ? err.message : "Gagal memeriksa formulir target URL.");
      console.error("Inspect error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="winui-card rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-semibold text-slate-900">Target Formulir</h2>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Langkah Opsional
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Masukkan URL formulir web yang ingin Anda isi secara otomatis (misal: formulir Google Form, SIMRS rumah sakit, pendaftaran online, atau sistem internal). Sistem akan menganalisis field input agar pemindaian OCR lebih presisi.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="url"
              placeholder="https://docs.google.com/forms/... atau https://sistem-anda/form"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full winui-input rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono"
              disabled={loading}
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"></div>
                  Menganalisis Form...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Periksa Field Form
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition border border-slate-300 shadow-xs flex items-center justify-center gap-1.5"
            >
              Lewati & Pindai Dokumen Langsung ➔
            </button>
          </div>
        </form>

        {/* WinUI 3 Feature Badges */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block mb-2">
            Mendukung berbagai jenis formulir & dokumen:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {MODES_INFO.map((item) => (
              <div key={item.mode} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0"></span>
                <div>
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
