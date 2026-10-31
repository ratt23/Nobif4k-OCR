import { useState, useEffect } from "react";

const MODE_COLORS = {
  TOHODO: "bg-blue-600 border-blue-500",
  QUICKFORM: "bg-purple-600 border-purple-500",
  LIGHTNING: "bg-amber-600 border-amber-500",
  DIRECT: "bg-emerald-600 border-emerald-500",
};

export default function StepSessionSync({
  sessionCode,
  data = {},
  recommendedMode = "DIRECT",
  onReset,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(String(sessionCode));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2200);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const modeBadgeColor = MODE_COLORS[recommendedMode] || MODE_COLORS.DIRECT;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700/70 text-center shadow-2xl space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-slate-900 border-slate-700 text-slate-300">
          <span>Mode:</span>
          <span className={`px-2 py-0.5 rounded text-white text-xs ${modeBadgeColor}`}>
            {recommendedMode}
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Sync Code Berhasil Dibuat!</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Buka ekstensi Nobif4k di Chrome Desktop Anda, lalu masukkan 4 digit kode berikut:
          </p>
        </div>

        {/* Giant Monospace Session Code with Cyan Glow */}
        <div
          onClick={handleCopyCode}
          title="Klik untuk menyalin kode"
          className="group relative cursor-pointer inline-flex flex-col items-center justify-center bg-slate-950 border-2 border-cyan-500/80 hover:border-cyan-400 rounded-3xl px-12 py-7 shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <span className="font-mono text-6xl sm:text-7xl font-extrabold tracking-widest text-cyan-400 select-all">
            {sessionCode || "----"}
          </span>
          <span className="text-xs text-slate-400 mt-2 font-mono group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
            {copiedCode ? (
              <span className="text-emerald-400 font-bold">✓ Tersalin ke Clipboard!</span>
            ) : (
              <span>Klik kode untuk menyalin 📋</span>
            )}
          </span>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-[11px] text-amber-300 border border-amber-500/30 font-mono">
            <span>⏱️</span>
            <span>Kedaluwarsa: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Step-by-Step Desktop Guide */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-left text-xs text-slate-300 space-y-2">
          <div className="font-bold text-white flex items-center gap-2">
            <span>💻</span> Langkah Autofill di Komputer / Desktop:
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
            <li>Buka halaman formulir web tujuan di browser Chrome laptop/PC Anda.</li>
            <li>Klik ikon ekstensi <strong className="text-slate-200">Nobif4k Autofill</strong>.</li>
            <li>Ketik kode <strong className="text-cyan-400 font-mono">{sessionCode}</strong> lalu klik <strong>Fetch Session</strong>.</li>
            <li>Klik <strong className="text-emerald-400">Direct Autofill</strong> — seluruh isian formulir otomatis terisi seketika!</li>
          </ol>
        </div>

        {/* JSON Preview */}
        <div className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Preview Payload JSON ({Object.keys(data).length} fields)
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {copiedJson ? "✓ JSON Tersalin" : "Salin JSON"}
            </button>
          </div>
          <pre className="bg-slate-950 text-emerald-400 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono overflow-x-auto max-h-40 scrollbar-thin">
            {jsonString}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex-1 py-3 px-4 bg-slate-700/80 hover:bg-slate-700 font-semibold text-xs text-white rounded-xl transition border border-slate-600"
          >
            {copiedJson ? "✓ JSON Tersalin" : "📋 Salin Raw JSON"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-white rounded-xl transition shadow-lg shadow-blue-900/30"
          >
            📸 Scan Dokumen Lain
          </button>
        </div>
      </div>
    </div>
  );
}
