import { useState, useRef, useEffect } from "react";
import { parseDocument, ApiError, PRODUCTION_API } from "../services/api";

const MODE_LABELS = {
  TOHODO: "Tohodo (Google Forms)",
  QUICKFORM: "QuickForm (Standard Form)",
  LIGHTNING: "Lightning (React / SPA)",
  DIRECT: "Direct Autofill",
};

const PROGRESS_STAGES = [
  { percent: 20, title: "Mengompresi Gambar", desc: "Menyesuaikan resolusi optimal untuk AI OCR" },
  { percent: 45, title: "Memvalidasi RAM Store", desc: "Memproses base64 aman tanpa disk logging (Zero Disk Rule)" },
  { percent: 75, title: "Menjalankan AI Vision OCR", desc: "Membaca teks NIK, Nama, Alamat & Tanggal Lahir" },
  { percent: 92, title: "Menghasilkan Sync Code", desc: "Membuat kode 4-digit untuk autofill desktop" },
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

  // Progressive progress bar animation while processing
  useEffect(() => {
    let timer;
    if (loading) {
      setProgress(15);
      setCurrentStageIdx(0);

      const t1 = setTimeout(() => {
        setProgress(40);
        setCurrentStageIdx(1);
      }, 1000);

      const t2 = setTimeout(() => {
        setProgress(70);
        setCurrentStageIdx(2);
      }, 2500);

      const t3 = setTimeout(() => {
        setProgress(88);
        setCurrentStageIdx(3);
      }, 4800);

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
        img.onerror = () => reject(new Error("Gagal membaca gambar"));
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
      }, 500);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Pemrosesan dibatalkan oleh pengguna.");
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
    <div className="space-y-6">
      {/* Step Card */}
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 border border-slate-700/70 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-xl font-bold tracking-tight text-white">Capture Dokumen / KTP</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ambil foto KTP, Kartu Pasien, Formulir, atau Resep dengan posisi tegak dan jelas.
            </p>
          </div>
          <button
            onClick={onBack}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition disabled:opacity-50"
          >
            ← Kembali
          </button>
        </div>

        {/* Recommended Mode Tag */}
        {recommendedMode && (
          <div className="mb-5 p-3.5 bg-slate-900/80 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <div className="text-xs font-semibold text-slate-300">
                Mode Autofill Target: <span className="text-cyan-400 font-bold">{MODE_LABELS[recommendedMode] || recommendedMode}</span>
              </div>
            </div>
            {detectedFields.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {detectedFields.length} target fields
              </span>
            )}
          </div>
        )}

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
          <div className="relative group border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-2xl p-6 sm:p-10 transition-all bg-gradient-to-b from-slate-900/60 to-slate-900/30 text-center">
            {/* Illuminated Corner Brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-400/70 rounded-tl"></div>
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400/70 rounded-tr"></div>
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400/70 rounded-bl"></div>
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400/70 rounded-br"></div>

            <div className="max-w-xs mx-auto py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl animate-radar">
                📸
              </div>
              <h3 className="text-base font-bold text-white mb-1">Pilih Sumber Foto Dokumen</h3>
              <p className="text-xs text-slate-400 mb-6">
                Mendukung KTP fisik, kartu identitas, paspor, atau formulir cetak.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileCameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs transition shadow-lg shadow-blue-900/30 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Ambil Kamera
                </button>

                <button
                  type="button"
                  onClick={() => fileGalleryRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-3.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-semibold text-xs transition border border-slate-600 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Unggah Galeri
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview + Scanner Animation Area */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/60 shadow-2xl">
              {/* Photo Image */}
              <img
                src={preview}
                alt="Captured Document"
                className={`w-full max-h-[380px] object-contain mx-auto transition-opacity duration-300 ${loading ? "opacity-75 filter contrast-105" : "opacity-100"}`}
              />

              {/* Laser Scanning Beam Animation (Active during loading) */}
              {loading && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Cyan Glowing Laser Bar */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-laser z-20"></div>

                  {/* Laser glow trail */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-blue-500/10 z-10"></div>

                  {/* Target Finder HUD Overlay */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400 z-20"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400 z-20"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400 z-20"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400 z-20"></div>

                  {/* Live HUD watermark */}
                  <div className="absolute top-4 left-12 text-[10px] font-mono text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30 z-20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    AI OCR SCANNING...
                  </div>
                </div>
              )}
            </div>

            {/* Live Progress Card when Loading */}
            {loading && (
              <div className="bg-slate-900/90 rounded-xl p-4 border border-blue-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                    {PROGRESS_STAGES[currentStageIdx]?.title || "Menganalisis Dokumen..."}
                  </span>
                  <span className="font-mono font-bold text-white">{progress}%</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400 italic">
                    {PROGRESS_STAGES[currentStageIdx]?.desc}
                  </p>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold underline px-2 py-0.5"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Actions when not loading */}
            {!loading && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    if (fileCameraRef.current) fileCameraRef.current.value = "";
                    if (fileGalleryRef.current) fileGalleryRef.current.value = "";
                  }}
                  className="flex-1 py-3 px-4 bg-slate-700/80 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition border border-slate-600 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Foto Ulang (Retake Photo)
                </button>
                <button
                  type="button"
                  onClick={() => fileGalleryRef.current?.click()}
                  className="py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition"
                >
                  Pilih Lain
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="mt-5 bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-xs text-red-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base text-red-400">⚠️</span>
              <div className="flex-1">
                <div className="font-bold text-red-300">Terjadi Kendala Pemindaian</div>
                <div className="mt-0.5 text-slate-300">{error}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-red-900/40">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  if (fileCameraRef.current) fileCameraRef.current.value = "";
                  setPreview(null);
                }}
                className="px-3 py-1.5 bg-red-800/50 hover:bg-red-800 text-white rounded-lg text-[11px] font-semibold transition"
              >
                Coba Lagi
              </button>

              {onResetApiUrl && (
                <button
                  type="button"
                  onClick={onResetApiUrl}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition border border-slate-700"
                >
                  Reset URL ke Production ({PRODUCTION_API})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Security Info Card */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-400 text-sm">🔒</span>
          <span>Zero Disk Storage Rule: Gambar diproses langsung di RAM dan tidak disimpan ke server.</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
          SECURE
        </span>
      </div>
    </div>
  );
}
