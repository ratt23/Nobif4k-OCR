import { useState, useEffect } from "react";
import StepUrlInspector from "./components/StepUrlInspector";
import StepCameraCapture from "./components/StepCameraCapture";
import StepReviewEditor from "./components/StepReviewEditor";
import StepSessionSync from "./components/StepSessionSync";
import { getDefaultBaseUrl, checkHealth, PRODUCTION_API } from "./services/api";

const STEPS = [
  { id: "url", stepNumber: 1, label: "Form Target" },
  { id: "camera", stepNumber: 2, label: "Scan OCR" },
  { id: "review", stepNumber: 3, label: "Review Data" },
  { id: "sync", stepNumber: 4, label: "Sync Code" },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState("url");
  const [baseUrl, setBaseUrl] = useState(() => {
    const saved = localStorage.getItem("nobif4k_api_base");
    return saved || getDefaultBaseUrl();
  });

  // Backend Health State
  const [backendHealth, setBackendHealth] = useState({ status: "checking", info: null });
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(baseUrl);

  // Flow State
  const [targetUrl, setTargetUrl] = useState("");
  const [recommendedMode, setRecommendedMode] = useState(null);
  const [detectedFields, setDetectedFields] = useState([]);
  const [inspectReason, setInspectReason] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState({});
  const [sessionCode, setSessionCode] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(null);
  const [ocrEngine, setOcrEngine] = useState(null);
  const [ocrModel, setOcrModel] = useState(null);

  // Check backend health periodically
  useEffect(() => {
    let active = true;

    const ping = async () => {
      try {
        const res = await checkHealth({ baseUrl, timeout: 5000 });
        if (active && res && res.success) {
          setBackendHealth({ status: "online", info: res });
        } else if (active) {
          setBackendHealth({ status: "offline", info: null });
        }
      } catch (e) {
        if (active) setBackendHealth({ status: "offline", info: null });
      }
    };

    ping();
    const interval = setInterval(ping, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [baseUrl]);

  const handleUrlInspected = ({ url, recommendedMode, reason, detectedFields }) => {
    setTargetUrl(url);
    setRecommendedMode(recommendedMode);
    setDetectedFields(detectedFields || []);
    setInspectReason(reason);
    setCurrentStep("camera");
  };

  const handleSkipInspect = () => {
    setTargetUrl("");
    setRecommendedMode("DIRECT");
    setDetectedFields([]);
    setInspectReason("Manual Direct Mode");
    setCurrentStep("camera");
  };

  const handleImageCaptured = ({ imageBase64, data, recommendedMode: mode, warning, sessionCode: code, engine, model }) => {
    setCapturedImage(imageBase64);
    setExtractedData(data || {});
    if (mode) setRecommendedMode(mode);
    setSessionWarning(warning);
    setSessionCode(code);
    setOcrEngine(engine);
    setOcrModel(model);
    setCurrentStep("review");
  };

  const handleReviewSaved = ({ code, data, recommendedMode: mode }) => {
    setSessionCode(code);
    setExtractedData(data);
    if (mode) setRecommendedMode(mode);
    setCurrentStep("sync");
  };

  const handleReset = () => {
    setCurrentStep("url");
    setTargetUrl("");
    setRecommendedMode(null);
    setDetectedFields([]);
    setInspectReason("");
    setCapturedImage(null);
    setExtractedData({});
    setSessionCode(null);
    setSessionWarning(null);
  };

  const handleSaveApiUrl = (newUrl) => {
    const clean = (newUrl || "").trim().replace(/\/+$/, "");
    const finalUrl = clean.endsWith("/nobif4k") ? clean : `${clean}/nobif4k`;
    setBaseUrl(finalUrl);
    localStorage.setItem("nobif4k_api_base", finalUrl);
    setIsApiModalOpen(false);
  };

  const handleResetToProduction = () => {
    setBaseUrl(PRODUCTION_API);
    localStorage.removeItem("nobif4k_api_base");
    setIsApiModalOpen(false);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Sticky Header with Glow */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              📄
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Nobif4k <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">OCR Suite</span>
              </h1>
              <p className="text-[10px] text-slate-400">Mobile OCR to Desktop Autofill Bridge</p>
            </div>
          </div>

          {/* Right Status Pill & Config Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempApiUrl(baseUrl);
                setIsApiModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                backendHealth.status === "online"
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60"
                  : backendHealth.status === "checking"
                  ? "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                  : "bg-red-950/40 text-red-300 border-red-500/40 hover:border-red-500 animate-pulse"
              }`}
              title="Klik untuk konfigurasi API backend"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth.status === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : backendHealth.status === "checking"
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              ></span>
              <span className="hidden sm:inline">
                {backendHealth.status === "online"
                  ? (backendHealth.info?.vision === "gemini" ? "API Online (Gemini AI)" : "API Online (Mock Mode)")
                  : backendHealth.status === "checking"
                  ? "Checking..."
                  : "API Offline"}
              </span>
              <span className="text-slate-400 text-xs ml-0.5">⚙️</span>
            </button>
          </div>
        </div>

        {/* Dynamic 4-Step Interactive Navigation Progress */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {STEPS.map((s, idx) => {
              const isActive = idx === currentStepIndex;
              const isPassed = idx < currentStepIndex;

              return (
                <div key={s.id} className="flex flex-col items-center text-center">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        : isPassed
                        ? "bg-blue-600"
                        : "bg-slate-800"
                    }`}
                  ></div>
                  <span
                    className={`text-[10px] mt-1.5 truncate font-medium transition-colors ${
                      isActive ? "text-cyan-400 font-bold" : isPassed ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {s.stepNumber}. {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {currentStep === "url" && (
          <StepUrlInspector
            baseUrl={baseUrl}
            onInspected={handleUrlInspected}
            onSkip={handleSkipInspect}
          />
        )}

        {currentStep === "camera" && (
          <StepCameraCapture
            baseUrl={baseUrl}
            targetUrl={targetUrl}
            recommendedMode={recommendedMode}
            detectedFields={detectedFields}
            onCaptured={handleImageCaptured}
            onBack={() => setCurrentStep("url")}
            onResetApiUrl={handleResetToProduction}
          />
        )}

        {currentStep === "review" && (
          <StepReviewEditor
            baseUrl={baseUrl}
            capturedImage={capturedImage}
            initialData={extractedData}
            recommendedMode={recommendedMode}
            sessionCode={sessionCode}
            warning={sessionWarning}
            ocrEngine={ocrEngine}
            ocrModel={ocrModel}
            onSaved={handleReviewSaved}
            onBack={() => setCurrentStep("camera")}
          />
        )}

        {currentStep === "sync" && (
          <StepSessionSync
            sessionCode={sessionCode}
            data={extractedData}
            recommendedMode={recommendedMode}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        <p>Nobif4k Autofill Bridge • Form-First Document Intelligence</p>
      </footer>

      {/* Modern API Settings Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚙️</span> Pengaturan API Backend
              </h3>
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  URL Endpoint Nobif4k Backend:
                </label>
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="https://graphicat.site/api/nobif4k"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Pilihan Cepat (Preset):</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempApiUrl(PRODUCTION_API)}
                    className="p-2 text-left rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                  >
                    <div className="font-semibold text-emerald-400">Production</div>
                    <div className="text-[10px] text-slate-400 truncate">graphicat.site/api/nobif4k</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempApiUrl("http://localhost:3001/api/nobif4k")}
                    className="p-2 text-left rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                  >
                    <div className="font-semibold text-blue-400">Local Dev</div>
                    <div className="text-[10px] text-slate-400 truncate">localhost:3001</div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong className="text-slate-300">Catatan:</strong> Jika Anda mengakses aplikasi dari HP/smartphone, jangan gunakan <code className="text-amber-400">localhost</code> karena HP tidak bisa menjangkau localhost laptop tanpa tunnel IP. Gunakan server <strong className="text-emerald-400">Production</strong>.
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetToProduction}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiUrl(tempApiUrl)}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-900/30"
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
