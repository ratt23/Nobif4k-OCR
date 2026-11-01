import { useState, useEffect } from "react";
import StepUrlInspector from "./components/StepUrlInspector";
import StepCameraCapture from "./components/StepCameraCapture";
import StepReviewEditor from "./components/StepReviewEditor";
import StepSessionSync from "./components/StepSessionSync";
import { getDefaultBaseUrl, checkHealth, PRODUCTION_API } from "./services/api";

const STEPS = [
  { id: "url", stepNumber: 1, label: "Target Formulir" },
  { id: "camera", stepNumber: 2, label: "Pindai Dokumen" },
  { id: "review", stepNumber: 3, label: "Tinjau & Autofill" },
  { id: "sync", stepNumber: 4, label: "Kode Sinkronisasi" },
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* WinUI 3 Navigation & Title Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                Nobif4k Scanner
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Autofill Utility
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Pemindai Dokumen & Pengisi Formulir Otomatis</p>
            </div>
          </div>

          {/* Right WinUI InfoBar Pill & Config */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempApiUrl(baseUrl);
                setIsApiModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-xs ${
                backendHealth.status === "online"
                  ? "bg-white text-emerald-700 border-slate-200 hover:bg-slate-50"
                  : backendHealth.status === "checking"
                  ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              }`}
              title="Konfigurasi Server API"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth.status === "online"
                    ? "bg-emerald-500"
                    : backendHealth.status === "checking"
                    ? "bg-amber-400"
                    : "bg-red-500"
                }`}
              ></span>
              <span className="hidden sm:inline">
                {backendHealth.status === "online" ? "Server Siap" : backendHealth.status === "checking" ? "Memeriksa..." : "Offline"}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* WinUI 3 Segmented Breadcrumb Stepper */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs overflow-x-auto">
            {STEPS.map((s, idx) => {
              const isActive = idx === currentStepIndex;
              const isPassed = idx < currentStepIndex;

              return (
                <div
                  key={s.id}
                  className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-md text-center transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-white text-blue-700 font-semibold shadow-xs border border-slate-200/80"
                      : isPassed
                      ? "text-blue-600 bg-blue-50/60 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isPassed
                        ? "bg-blue-200 text-blue-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isPassed ? "✓" : s.stepNumber}
                  </span>
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
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
            targetUrl={targetUrl}
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
            targetUrl={targetUrl}
            recommendedMode={recommendedMode}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nobif4k Autofill Bridge • Pemindai Dokumen Windows UI</span>
          <span className="text-[11px] text-slate-400">Penyimpanan Sementara Aman (Zero Disk Storage)</span>
        </div>
      </footer>

      {/* WinUI Style Dialog: API Settings */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan Endpoint Server API
              </h3>
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  URL Endpoint Backend:
                </label>
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="https://graphicat.site/api/nobif4k"
                  className="w-full winui-input rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <span className="text-slate-500 block mb-1.5 font-medium">Pilihan Server:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempApiUrl(PRODUCTION_API)}
                    className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition"
                  >
                    <div className="font-semibold text-blue-700 text-xs">Production (Aktif)</div>
                    <div className="text-[10px] text-slate-500 truncate">graphicat.site/api/nobif4k</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempApiUrl("http://localhost:3001/api/nobif4k")}
                    className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <div className="font-semibold text-slate-700 text-xs">Localhost Dev</div>
                    <div className="text-[10px] text-slate-500 truncate">localhost:3001</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetToProduction}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiUrl(tempApiUrl)}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
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
