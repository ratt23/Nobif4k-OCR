import { useState } from "react";
import StepUrlInspector from "./components/StepUrlInspector";
import StepCameraCapture from "./components/StepCameraCapture";
import StepReviewEditor from "./components/StepReviewEditor";
import StepSessionSync from "./components/StepSessionSync";
import { getDefaultBaseUrl } from "./services/api";

const STEPS = { URL: "url", CAMERA: "camera", REVIEW: "review", SYNC: "sync" };

export default function App() {
  const [step, setStep] = useState(STEPS.URL);
  const [baseUrl, setBaseUrl] = useState(() => {
    const saved = localStorage.getItem("nobif4k_api_base");
    return saved || getDefaultBaseUrl();
  });
  const [targetUrl, setTargetUrl] = useState("");
  const [recommendedMode, setRecommendedMode] = useState(null);
  const [detectedFields, setDetectedFields] = useState([]);
  const [inspectReason, setInspectReason] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState({});
  const [sessionCode, setSessionCode] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(null);

  const handleUrlInspected = ({ url, recommendedMode, reason, detectedFields }) => {
    setTargetUrl(url);
    setRecommendedMode(recommendedMode);
    setDetectedFields(detectedFields || []);
    setInspectReason(reason);
    setStep(STEPS.CAMERA);
  };

  const handleSkipInspect = () => {
    setTargetUrl("");
    setRecommendedMode("DIRECT");
    setDetectedFields([]);
    setInspectReason("Skipped URL inspection (manual mode).");
    setStep(STEPS.CAMERA);
  };

  const handleImageCaptured = ({ imageBase64, data, recommendedMode: mode, warning, sessionCode: code }) => {
    setCapturedImage(imageBase64);
    setExtractedData(data || {});
    if (mode) setRecommendedMode(mode);
    setSessionWarning(warning);
    setSessionCode(code);
    setStep(STEPS.REVIEW);
  };

  const handleReviewSaved = ({ code, data, recommendedMode: mode }) => {
    setSessionCode(code);
    setExtractedData(data);
    if (mode) setRecommendedMode(mode);
    setStep(STEPS.SYNC);
  };

  const handleReset = () => {
    setStep(STEPS.URL);
    setTargetUrl("");
    setRecommendedMode(null);
    setDetectedFields([]);
    setInspectReason("");
    setCapturedImage(null);
    setExtractedData({});
    setSessionCode(null);
    setSessionWarning(null);
  };

  const handleBaseUrlChange = (newBase) => {
    setBaseUrl(newBase);
    localStorage.setItem("nobif4k_api_base", newBase);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">📄 Nobif4k Autofill Bridge</h1>
          <button
            onClick={() => {
              const newBase = prompt("Backend API Base URL:", baseUrl);
              if (newBase !== null && newBase.trim()) handleBaseUrlChange(newBase.trim());
            }}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition"
            title="Change backend API URL"
          >
            ⚙️ API
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === STEPS.URL && (
          <StepUrlInspector
            baseUrl={baseUrl}
            onInspected={handleUrlInspected}
            onSkip={handleSkipInspect}
          />
        )}
        {step === STEPS.CAMERA && (
          <StepCameraCapture
            baseUrl={baseUrl}
            targetUrl={targetUrl}
            recommendedMode={recommendedMode}
            detectedFields={detectedFields}
            onCaptured={handleImageCaptured}
            onBack={() => setStep(STEPS.URL)}
          />
        )}
        {step === STEPS.REVIEW && (
          <StepReviewEditor
            baseUrl={baseUrl}
            capturedImage={capturedImage}
            initialData={extractedData}
            recommendedMode={recommendedMode}
            sessionCode={sessionCode}
            warning={sessionWarning}
            onSaved={handleReviewSaved}
            onBack={() => setStep(STEPS.CAMERA)}
          />
        )}
        {step === STEPS.SYNC && (
          <StepSessionSync
            sessionCode={sessionCode}
            data={extractedData}
            recommendedMode={recommendedMode}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-6 text-center text-xs text-slate-500">
        Nobif4k Suite v1.0 · Mobile-first OCR + Desktop Chrome Extension Autofill
      </footer>
    </div>
  );
}
