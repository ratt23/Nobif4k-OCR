import { useState, useRef, useEffect } from "react";
import { parseDocument, ApiError, PRODUCTION_API } from "../services/api";

const MODE_LABELS = {
  TOHODO: "Google Forms",
  QUICKFORM: "Standard Form",
  LIGHTNING: "React / Modern SPA",
  DIRECT: "Universal Autofill",
};

const PROGRESS_STAGES = [
  { percent: 25, title: "Menyiapkan Dokumen", desc: "Mengoptimalkan resolusi gambar untuk pemindaian teks" },
  { percent: 55, title: "Membaca Teks Dokumen", desc: "Mendeteksi apakah kartu identitas atau dokumen teks/paragraf" },
  { percent: 85, title: "Mengekstrak Struktur & Paragraf", desc: "Menyusun field data dan seluruh isi paragraf lengkap" },
  { percent: 98, title: "Menyiapkan Autofill", desc: "Membuat data siap pakai untuk formulir" },
];

export default function StepCameraCapture({
  baseUrl,
  targetUrl,
  recommendedMode,
  detectedFields,
  onCaptured,
  onBack,
  onResetApiUrl,
}) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [error, setError] = useState(null);

  const fileCameraRef = useRef(null);
  const fileGalleryRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    let timer;
    if (loading) {
      setProgress(20);
      setCurrentStageIdx(0);

      const t1 = setTimeout(() => {
        setProgress(50);
        setCurrentStageIdx(1);
      }, 1000);

      const t2 = setTimeout(() => {
        setProgress(80);
        setCurrentStageIdx(2);
      }, 2500);

      const t3 = setTimeout(() => {
        setProgress(95);
        setCurrentStageIdx(3);
      }, 4500);

      timer = { t1, t2, t3 };
    } else {
      setProgress(0);
    }

    return () => {
      if (timer) {
        clearTimeout(timer.t1);
        clearTimeout(timer.t2);
        clearTimeout(timer.t3);
      }
    };
  }, [loading]);

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

          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error("Gagal membaca file gambar"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Gagal membuka file"));
      reader.readAsDataURL(file);
    });
  };

  const processImageFile = async (file) => {
    if (!file) return;

    setError(null);
    setLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const compressed = await compressImage(file);
      setPreview(compressed);

      const result = await parseDocument(compressed, {
        targetFields: detectedFields,
        recommendedMode,
        sourceUrl: targetUrl,
        baseUrl,
        signal: abortControllerRef.current?.signal,
      });

      setProgress(100);

      setTimeout(() => {
        onCaptured({
          imageBase64: compressed,
          data: result.data,
          recommendedMode: result.recommendedMode || recommendedMode,
          warning: result.warning,
          sessionCode: result.sessionCode,
          engine: result.engine,
          model: result.model,
        });
      }, 400);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Pemrosesan dibatalkan.");
      } else {
        setError(err instanceof ApiError ? err.message : "Gagal memproses gambar dokumen.");
      }
      console.error("Capture error:", err);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <div className="winui-card rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
              2
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Pindai Dokumen / Kartu Identitas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dukungan cerdas: Jika terdeteksi dokumen teks/surat maka seluruh paragraf akan dipindai lengkap; jika kartu identitas maka field nama/NIK akan diekstrak.
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            disabled={loading}
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition font-medium disabled:opacity-50"
          >
            ← Kembali
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => processImageFile(e.target.files?.[0])}
          disabled={loading}
          className="hidden"
        />
        <input
          ref={fileGalleryRef}
          type="file"
          accept="image/*"
          onChange={(e) => processImageFile(e.target.files?.[0])}
          disabled={loading}
          className="hidden"
        />

        {/* Viewfinder Area */}
        {!preview ? (
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 sm:p-12 transition-all bg-slate-50/60 text-center relative group">
            <div className="max-w-sm mx-auto">
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 mb-1">Ambil Foto Dokumen atau Kartu</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Posisikan dokumen atau surat di tempat terang dan tegak lurus agar seluruh teks terbaca jelas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileCameraRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-xs transition active:scale-98"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Buka Kamera
                </button>

                <button
                  type="button"
                  onClick={() => fileGalleryRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-xs shadow-xs transition active:scale-98"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Pilih Galeri/File
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview and Clean Progress Area */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
              <img
                src={preview}
                alt="Foto Dokumen"
                className={`w-full max-h-[380px] object-contain mx-auto transition-opacity duration-200 ${
                  loading ? "opacity-75" : "opacity-100"
                }`}
              />
            </div>

            {/* WinUI Fluent Progress Bar */}
            {loading && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full"></div>
                    <span>{PROGRESS_STAGES[currentStageIdx]?.title || "Memproses Dokumen..."}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{progress}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500">
                  {PROGRESS_STAGES[currentStageIdx]?.desc}
                </p>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {!loading && (
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => fileCameraRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition"
                >
                  Ambil Foto Ulang
                </button>
                <button
                  type="button"
                  onClick={() => fileGalleryRef.current?.click()}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-xs transition"
                >
                  Pilih Gambar Lain
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 space-y-2">
            <div className="flex items-start gap-2">
              <span>⚠️</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-red-100">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setPreview(null);
                }}
                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-medium"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
