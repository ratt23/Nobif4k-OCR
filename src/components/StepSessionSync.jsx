import { useState } from "react";

const MODE_COLORS = {
  TOHODO: "bg-blue-600 border-blue-500",
  QUICKFORM: "bg-purple-600 border-purple-500",
  LIGHTNING: "bg-amber-600 border-amber-500",
  DIRECT: "bg-green-600 border-green-500",
};

export default function StepSessionSync({
  sessionCode,
  data = {},
  recommendedMode = "DIRECT",
  onReset,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(String(sessionCode));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const modeBadgeColor = MODE_COLORS[recommendedMode] || MODE_COLORS.DIRECT;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border bg-slate-900 border-slate-700 text-slate-300">
          <span>Mode:</span>
          <span className={`px-2 py-0.5 rounded text-white text-xs ${modeBadgeColor}`}>
            {recommendedMode}
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">Sync Code Generated!</h2>
        <p className="text-sm text-slate-400 mb-6">
          Open the Nobif4k extension on Desktop Chrome and enter this 4-digit code:
        </p>

        {/* Giant Monospace Session Code */}
        <div
          onClick={handleCopyCode}
          title="Click to copy code"
          className="group relative cursor-pointer inline-flex flex-col items-center justify-center bg-slate-950 border-2 border-blue-500/80 rounded-2xl px-10 py-6 mb-6 shadow-2xl hover:border-blue-400 transition"
        >
          <span className="font-mono text-6xl md:text-7xl font-extrabold tracking-widest text-blue-400 select-all">
            {sessionCode || "----"}
          </span>
          <span className="text-xs text-slate-400 mt-2 font-mono group-hover:text-blue-300">
            {copiedCode ? "✓ Copied to Clipboard!" : "Click code to copy"}
          </span>
        </div>

        {/* Next Steps Card */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 text-left text-xs text-slate-300 mb-6 space-y-2">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>💻</span> On Desktop Chrome:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Open the target form page in your browser.</li>
            <li>Click the <strong className="text-slate-200">Nobif4k</strong> extension icon.</li>
            <li>Enter code <strong className="text-blue-400 font-mono">{sessionCode}</strong> and click <strong>Fetch Session</strong>.</li>
            <li>Click <strong className="text-green-400">Direct Autofill</strong> or copy your preferred rule format!</li>
          </ol>
          <p className="text-[11px] text-slate-500 pt-1">
            ⏱ Session expires in 15 minutes. Data is held in RAM only (Zero Disk rule).
          </p>
        </div>

        {/* JSON Preview & Copy Actions */}
        <div className="text-left mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Final Payload Preview ({Object.keys(data).length} fields)
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 underline"
            >
              {copiedJson ? "✓ Copied JSON" : "Copy Raw JSON"}
            </button>
          </div>
          <pre className="bg-slate-950 text-emerald-400 p-3 rounded border border-slate-800 text-xs font-mono overflow-x-auto max-h-48 scrollbar-thin">
            {jsonString}
          </pre>
        </div>

        {/* Reset Action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex-1 bg-slate-700 hover:bg-slate-600 font-semibold py-3 px-4 rounded text-sm text-slate-200 transition"
          >
            {copiedJson ? "✓ Copied JSON" : "📋 Copy Raw JSON"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold py-3 px-4 rounded text-sm text-white transition shadow-lg shadow-blue-600/20"
          >
            📸 Scan Another Document
          </button>
        </div>
      </div>
    </div>
  );
}

