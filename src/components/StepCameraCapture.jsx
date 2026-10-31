import { useState, useRef } from "react";
import { parseDocument, ApiError } from "../services/api";

const MODE_LABELS = {
  TOHODO: "Tohodo",
  QUICKFORM: "QuickForm",
  LIGHTNING: "Lightning",
  DIRECT: "Direct",
};

export default function StepCameraCapture({
  baseUrl,
  targetUrl,
  recommendedMode,
  detectedFields,
  onCaptured,
  onBack,
}) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 1600;
          let { width, height } = img;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = (height / width) * MAX_DIM;
              width = MAX_DIM;
            } else {
              width = (width / height) * MAX_DIM;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const compressed = await compressImage(file);
      setPreview(compressed);

      const result = await parseDocument(compressed, {
        targetFields: detectedFields,
        recommendedMode,
        sourceUrl: targetUrl,
        baseUrl,
      });

      onCaptured({
        imageBase64: compressed,
        data: result.data,
        recommendedMode: result.recommendedMode || recommendedMode,
        warning: result.warning,
        sessionCode: result.sessionCode,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to process image.");
      console.error("Capture error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Step 2: Capture Document</h2>
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Back
          </button>
        </div>

        {recommendedMode && (
          <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-blue-600 px-2 py-0.5 rounded">
                {MODE_LABELS[recommendedMode] || recommendedMode}
              </span>
              <span className="text-xs text-slate-400">Recommended Mode</span>
            </div>
            {detectedFields.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Detected {detectedFields.length} field(s): {detectedFields.slice(0, 5).join(", ")}
                {detectedFields.length > 5 && "..."}
              </p>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />

        {!preview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 font-semibold py-16 rounded-lg transition border-2 border-dashed border-slate-600 hover:border-blue-500"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-slate-600 border-t-blue-500 rounded-full" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📷</span>
                <span>Tap to Capture</span>
              </div>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <img src={preview} alt="Preview" className="w-full rounded border border-slate-600" />
            <button
              onClick={() => {
                setPreview(null);
                fileInputRef.current.value = "";
              }}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 py-3 rounded transition"
            >
              Retake Photo
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
