import { useState } from "react";
import { updateSession, ApiError } from "../services/api";

const MODE_LABELS = {
  DIRECT: "Universal Direct Autofill",
  TOHODO: "Google Forms",
  QUICKFORM: "Standard HTML Form",
  LIGHTNING: "React / Modern SPA",
};

export default function StepReviewEditor({
  baseUrl,
  targetUrl,
  capturedImage,
  initialData = {},
  recommendedMode,
  sessionCode,
  warning,
  ocrEngine,
  ocrModel,
  onSaved,
  onBack,
}) {
  // Detect if there are document paragraphs
  const paragraphKey = Object.keys(initialData).find((k) =>
    ["paragraf_lengkap", "teks_lengkap", "isi_paragraf", "paragraf", "isi_dokumen"].includes(k.toLowerCase())
  );

  const [paragraphText, setParagraphText] = useState(
    paragraphKey && initialData[paragraphKey] ? String(initialData[paragraphKey]) : ""
  );

  const [fields, setFields] = useState(() => {
    const entries = Object.entries(initialData);
    if (entries.length === 0) {
      return [{ id: "1", key: "nama", value: "" }];
    }
    // Filter out the primary whole-paragraph text from the key-value list if it's shown in the dedicated box
    const filtered = paragraphKey ? entries.filter(([k]) => k !== paragraphKey) : entries;
    return filtered.map(([k, v], idx) => ({
      id: `${idx}-${Date.now()}`,
      key: k,
      value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
    }));
  });

  const [mode, setMode] = useState(recommendedMode || "DIRECT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [directAutofillSuccess, setDirectAutofillSuccess] = useState(false);
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

  const handleRemoveField = (id) => {
    setFields((prev) => prev.filter((item) => item.id !== id));
  };

  const getCleanData = () => {
    const cleanData = {};
    if (paragraphKey && paragraphText.trim()) {
      cleanData[paragraphKey] = paragraphText.trim();
    }
    for (const f of fields) {
      const k = f.key.trim();
      if (k) cleanData[k] = f.value;
    }
    return cleanData;
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (_) {}
  };

  const handleCopyAll = () => {
    const clean = getCleanData();
    const formatted = Object.entries(clean)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join("\n");
    copyToClipboard(formatted, "Semua data berhasil disalin ke clipboard!");
  };

  const handleCopyParagraph = () => {
    if (!paragraphText) return;
    copyToClipboard(paragraphText, "Seluruh paragraf dokumen berhasil disalin!");
  };

  // Direct Frontend Autofill Trigger
  const handleDirectAutofill = async () => {
    const cleanData = getCleanData();

    // 1. Broadcast to any open tab / Chrome extension listening via window messaging
    try {
      window.postMessage(
        {
          type: "NOBIF4K_DIRECT_AUTOFILL",
          source: "nobif4k-web",
          mode,
          data: cleanData,
        },
        "*"
      );
    } catch (_) {}

    // 2. If targetUrl is set, open it and prepare autofill
    if (targetUrl) {
      // Store in localStorage for target tab
      localStorage.setItem("nobif4k_direct_payload", JSON.stringify(cleanData));
      window.open(targetUrl, "_blank");
    }

    // 3. Also copy JSON to clipboard as instant universal fallback
    await copyToClipboard(
      JSON.stringify(cleanData, null, 2),
      "Data formulir siap! Disalin ke clipboard untuk autofill instan."
    );

    setDirectAutofillSuccess(true);
    setTimeout(() => setDirectAutofillSuccess(false), 4000);
  };

  const handleProceedToSync = async () => {
    setLoading(true);
    setError(null);
    const cleanData = getCleanData();

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
    <div className="space-y-5">
      <div className="winui-card rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
              3
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Tinjau Data & Direct Autofill</h2>
              <p className="text-xs text-slate-500">
                Periksa data hasil pemindaian. Anda dapat langsung melakukan autofill atau menyalin teks di sini.
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition font-medium"
          >
            ← Foto Ulang
          </button>
        </div>

        {/* Copy Feedback Alert Bar */}
        {copyFeedback && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center gap-2 transition animate-fade-in">
            <span>✓</span>
            <span className="font-medium">{copyFeedback}</span>
          </div>
        )}

        {/* Direct Autofill Alert */}
        {directAutofillSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <span>⚡</span> Direct Autofill Berjalan!
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Data terformat telah disalin ke clipboard dan disiarkan ke formulir. Jika formulir Anda berada di tab lain, tekan <strong>Ctrl + V</strong> atau klik ikon Ekstensi Chrome untuk pengisian otomatis 1-detik.
            </p>
          </div>
        )}

        {/* Thumbnail Preview (Collapsible) */}
        {capturedImage && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Foto Dokumen yang Dipindai
              </span>
              <button
                type="button"
                onClick={() => setImageExpanded(!imageExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {imageExpanded ? "Kecilkan Foto ▲" : "Perbesar Foto ▼"}
              </button>
            </div>
            <div
              className={`overflow-hidden rounded border border-slate-200 bg-slate-100 transition-all duration-200 ${
                imageExpanded ? "max-h-[480px]" : "max-h-24"
              }`}
            >
              <img
                src={capturedImage}
                alt="Document Preview"
                className="w-full object-contain mx-auto"
              />
            </div>
          </div>
        )}

        {/* WHOLE PARAGRAPH DETECTED: DEDICATED WINUI PARAGRAPH BOX */}
        {paragraphKey && (
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📄</span>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Isi Paragraf Dokumen Lengkap (Whole Paragraph)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Terdeteksi dokumen teks/surat. Teks paragraf dipindai secara utuh.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyParagraph}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-slate-700 shadow-xs transition"
              >
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Salin Seluruh Paragraf
              </button>
            </div>

            <textarea
              rows={6}
              value={paragraphText}
              onChange={(e) => setParagraphText(e.target.value)}
              className="w-full winui-input rounded-lg p-3 text-xs leading-relaxed font-sans text-slate-800"
              placeholder="Teks paragraf dokumen akan tampil di sini..."
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Jumlah kata: <strong>{paragraphText.trim() ? paragraphText.trim().split(/\s+/).length : 0}</strong> kata
              </span>
              <span>
                Karakter: <strong>{paragraphText.length}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Structured Field Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">
              Field Data Terstruktur ({fields.length} Field)
            </h3>
            <button
              type="button"
              onClick={handleAddField}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              + Tambah Field Manual
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((f) => {
              const isMultiline = f.value.includes("\n") || f.value.length > 70;

              return (
                <div
                  key={f.id}
                  className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={f.key}
                      onChange={(e) => handleFieldChange(f.id, "key", e.target.value)}
                      placeholder="Nama Field (misal: nama, nik)"
                      className="winui-input rounded px-2 py-1 text-xs font-semibold text-slate-800 w-44 bg-white"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(f.value, `Disalin: ${f.key}`)}
                        className="px-2 py-1 text-[11px] rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium"
                        title="Salin nilai field ini"
                      >
                        Salin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(f.id)}
                        className="p-1 text-slate-400 hover:text-red-600 text-xs rounded"
                        title="Hapus field ini"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {isMultiline ? (
                    <textarea
                      rows={3}
                      value={f.value}
                      onChange={(e) => handleFieldChange(f.id, "value", e.target.value)}
                      className="w-full winui-input rounded px-2.5 py-1.5 text-xs text-slate-800 bg-white"
                      placeholder="Isi teks field..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) => handleFieldChange(f.id, "value", e.target.value)}
                      className="w-full winui-input rounded px-2.5 py-1.5 text-xs text-slate-800 bg-white"
                      placeholder="Nilai field..."
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Action Commands (Front End Direct Autofill) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Primary Direct Autofill Button */}
            <button
              type="button"
              onClick={handleDirectAutofill}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Direct Autofill ke Formulir
            </button>

            {/* Copy All Data Button */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Salin Semua Data
            </button>

            {/* Advance to Step 4 Sync Code */}
            <button
              type="button"
              onClick={handleProceedToSync}
              disabled={loading}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
            >
              {loading ? "Menyimpan..." : "Kode Ekstensi (Langkah 4) ➔"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
