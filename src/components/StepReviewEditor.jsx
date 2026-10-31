import { useState } from "react";
import { updateSession, ApiError } from "../services/api";

const MODE_LABELS = {
  TOHODO: "Tohodo (Static HTML Form)",
  QUICKFORM: "QuickForm (Modern SPA)",
  LIGHTNING: "Lightning (Iframe / Shadow DOM)",
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
  // Convert initialData object to editable array of { id, key, value }
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

    // Build key-value map, filtering out empty keys
    const cleanData = {};
    for (const item of fields) {
      const k = item.key.trim().toLowerCase().replace(/\s+/g, "_");
      if (k) {
        cleanData[k] = item.value;
      }
    }

    if (Object.keys(cleanData).length === 0) {
      setError("Please add at least one field with a name.");
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
        // Fallback if no sessionCode was generated yet
        onSaved({
          code: "9999",
          data: cleanData,
          recommendedMode: mode,
        });
      }
    } catch (err) {
      console.error("Save session error:", err);
      setError(err instanceof ApiError ? err.message : "Failed to save session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Step 3: Review & Edit Data</h2>
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Retake Photo
          </button>
        </div>

        {warning && (
          <div className="mb-4 bg-amber-900/30 border border-amber-600 rounded p-3 text-xs text-amber-200">
            ⚠️ {warning}
          </div>
        )}

        {/* Thumbnail Preview with Click-to-Zoom */}
        {capturedImage && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Captured Document:</span>
              <button
                type="button"
                onClick={() => setImageExpanded(!imageExpanded)}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                {imageExpanded ? "Collapse Photo" : "View Full Photo"}
              </button>
            </div>
            <div
              className={`relative overflow-hidden rounded border border-slate-700 bg-black/40 transition-all ${
                imageExpanded ? "max-h-[500px]" : "max-h-36"
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

        {/* Mode Selector */}
        <div className="mb-6 p-3 bg-slate-900 rounded border border-slate-700">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Target Autofill Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DIRECT">{MODE_LABELS.DIRECT}</option>
            <option value="TOHODO">{MODE_LABELS.TOHODO}</option>
            <option value="QUICKFORM">{MODE_LABELS.QUICKFORM}</option>
            <option value="LIGHTNING">{MODE_LABELS.LIGHTNING}</option>
          </select>
        </div>

        {/* Editable Fields List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Extracted Fields ({fields.length})
            </span>
            <button
              type="button"
              onClick={handleAddField}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              + Add Field
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-700/60"
              >
                <input
                  type="text"
                  placeholder="field_name"
                  value={field.key}
                  onChange={(e) => handleFieldChange(field.id, "key", e.target.value)}
                  className="w-1/3 bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs font-mono text-blue-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Field value..."
                  value={field.value}
                  onChange={(e) => handleFieldChange(field.id, "value", e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id)}
                  title="Delete field"
                  className="text-slate-500 hover:text-red-400 px-2 py-1 text-base transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddField}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-3 px-4 rounded transition"
          >
            + Add Field
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 font-semibold py-3 px-6 rounded transition flex items-center justify-center gap-2 text-white shadow-lg shadow-green-600/20"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                <span>Saving & Syncing...</span>
              </>
            ) : (
              <span>Save & Generate Sync Code 🚀</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

