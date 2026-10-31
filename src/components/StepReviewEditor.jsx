import { useState } from "react";
import { updateSession, ApiError } from "../services/api";

const MODE_LABELS = {
  TOHODO: "Tohodo (Google Forms)",
  QUICKFORM: "QuickForm (Standard Form)",
  LIGHTNING: "Lightning (React / SPA)",
  DIRECT: "Direct Autofill",
};

export default function StepReviewEditor({
  baseUrl,
  capturedImage,
  initialData = {},
  recommendedMode,
  sessionCode,
  warning,
  onSaved,
  onBack,
}) {
  const [fields, setFields] = useState(() => {
    const entries = Object.entries(initialData);
    if (entries.length === 0) {
      return [{ id: "1", key: "nama", value: "" }];
    }
    return entries.map(([k, v], idx) => ({
      id: `${idx}-${Date.now()}`,
      key: k,
      value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
    }));
  });

  const [mode, setMode] = useState(recommendedMode || "DIRECT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageExpanded, setImageExpanded] = useState(false);

  const handleFieldChange = (id, fieldName, newVal) => {
    setFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [fieldName]: newVal } : item))
    );
  };

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      { id: `field-${Date.now()}-${Math.random()}`, key: "", value: "" },
    ]);
  };

  const handleDeleteField = (id) => {
    setFields((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const cleanData = {};
    for (const item of fields) {
      const k = item.key.trim().toLowerCase().replace(/\s+/g, "_");
      if (k) {
        cleanData[k] = item.value;
      }
    }

    if (Object.keys(cleanData).length === 0) {
      setError("Tambahkan minimal 1 field data.");
      setLoading(false);
      return;
    }

    try {
      if (sessionCode) {
        const result = await updateSession(sessionCode, {
          data: cleanData,
          recommendedMode: mode,
          baseUrl,
        });

        onSaved({
          code: result.code || sessionCode,
          data: result.data || cleanData,
          recommendedMode: result.recommendedMode || mode,
        });
      } else {
        onSaved({
          code: "9999",
          data: cleanData,
          recommendedMode: mode,
        });
      }
    } catch (err) {
      console.error("Save session error:", err);
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan revisi sesi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 border border-slate-700/70 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
            <h2 className="text-xl font-bold tracking-tight text-white">Review & Koreksi Data</h2>
          </div>
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition"
          >
            ← Foto Ulang
          </button>
        </div>

        {warning && (
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
            <span>⚠️</span>
            <div>{warning}</div>
          </div>
        )}

        {/* Thumbnail Preview */}
        {capturedImage && (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <span>📷</span> Foto Dokumen KTP:
              </span>
              <button
                type="button"
                onClick={() => setImageExpanded(!imageExpanded)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                {imageExpanded ? "Kecilkan Foto ▲" : "Lihat Foto Lengkap ▼"}
              </button>
            </div>
            <div
              className={`relative overflow-hidden rounded-lg border border-slate-700 bg-black/60 transition-all duration-300 ${
                imageExpanded ? "max-h-[500px]" : "max-h-28"
              }`}
            >
              <img
                src={capturedImage}
                alt="Captured document"
                className="w-full object-contain cursor-pointer"
                onClick={() => setImageExpanded(!imageExpanded)}
              />
            </div>
          </div>
        )}

        {/* Autofill Mode Selector */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Mode Autofill Target
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DIRECT">{MODE_LABELS.DIRECT}</option>
            <option value="TOHODO">{MODE_LABELS.TOHODO}</option>
            <option value="QUICKFORM">{MODE_LABELS.QUICKFORM}</option>
            <option value="LIGHTNING">{MODE_LABELS.LIGHTNING}</option>
          </select>
        </div>

        {/* Extracted Fields Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Field Terdeteksi ({fields.length})
            </span>
            <button
              type="button"
              onClick={handleAddField}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40"
            >
              + Tambah Field
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-xl border border-slate-700/60 hover:border-slate-600 transition"
              >
                <input
                  type="text"
                  placeholder="nama_field"
                  value={field.key}
                  onChange={(e) => handleFieldChange(field.id, "key", e.target.value)}
                  className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Nilai data..."
                  value={field.value}
                  onChange={(e) => handleFieldChange(field.id, "value", e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id)}
                  title="Hapus field"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-500 flex items-center justify-center text-sm transition border border-slate-700/60"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2.5 pt-2 border-t border-slate-700/60">
          <button
            type="button"
            onClick={handleAddField}
            disabled={loading}
            className="py-3 px-4 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-600"
          >
            + Tambah
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"></div>
                Menyimpan...
              </>
            ) : (
              <span>Simpan & Buat Kode Sync (4 Digit) 🚀</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
