import { useState, useEffect } from "react";

export default function StepSessionSync({
  sessionCode,
  data = {},
  targetUrl,
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
    } catch (_) {}
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2200);
    } catch (_) {}
  };

  return (
    <div className="space-y-5">
      <div className="winui-card rounded-xl p-6 sm:p-8 text-center space-y-5">
        <div>
          <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full mb-2">
            Mode: {recommendedMode}
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Kode Sinkronisasi Siap
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Gunakan kode 4 digit ini pada Ekstensi Chrome desktop Anda untuk mengisi formulir target secara instan.
          </p>
        </div>

        {/* WinUI Clean Code Box */}
        <div
          onClick={handleCopyCode}
          title="Klik untuk menyalin kode"
          className="cursor-pointer inline-flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-50 border-2 border-blue-600 rounded-xl px-10 py-6 transition shadow-xs active:scale-98"
        >
          <span className="font-mono text-5xl sm:text-6xl font-bold tracking-widest text-blue-700 select-all">
            {sessionCode || "----"}
          </span>
          <span className="text-xs text-slate-600 mt-2 font-medium flex items-center gap-1.5">
            {copiedCode ? (
              <span className="text-emerald-700 font-semibold">✓ Kode Tersalin!</span>
            ) : (
              <span>Klik kode untuk menyalin 📋</span>
            )}
          </span>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600 font-mono">
            <span>⏱️ Kedaluwarsa dalam: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Step-by-Step Desktop Guide */}
        <div className="bg-slate-50 rounded-xl p-4 text-left text-xs border border-slate-200/80 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Cara Penggunaan di Browser Komputer (Chrome Desktop):
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
            <li>Buka halaman formulir web tujuan di browser Chrome laptop/PC Anda.</li>
            <li>Klik ikon ekstensi <strong>Nobif4k Autofill</strong> di toolbar atas.</li>
            <li>Masukkan kode <strong>{sessionCode}</strong> lalu klik <strong>Fetch Session</strong>.</li>
            <li>Klik <strong>Direct Autofill</strong> — seluruh isian formulir otomatis terisi lengkap!</li>
          </ol>
        </div>

        {/* JSON Preview */}
        <div className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Payload Data ({Object.keys(data).length} Field)
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {copiedJson ? "✓ JSON Tersalin" : "Salin JSON"}
            </button>
          </div>
          <pre className="bg-white text-slate-800 p-3 rounded-lg border border-slate-200 text-[11px] font-mono overflow-x-auto max-h-36">
            {jsonString}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 shadow-xs transition"
          >
            {copiedJson ? "✓ Format JSON Tersalin" : "Salin Format JSON"}
          </button>

          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5"
            >
              Buka Form Target ↗
            </a>
          )}

          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
          >
            Pindai Dokumen Lain
          </button>
        </div>
      </div>
    </div>
  );
}
