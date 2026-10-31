export const PRODUCTION_API = "https://graphicat.site/api/nobif4k";

export function resolveApiBase() {
  if (typeof window !== "undefined") {
    // 1. URL search param: ?api=...
    const params = new URLSearchParams(window.location.search);
    const apiParam = params.get("api");
    if (apiParam) {
      let clean = apiParam.trim().replace(/\/+$/, "");
      return clean.endsWith("/nobif4k") ? clean : `${clean}/nobif4k`;
    }

    // 2. LocalStorage override
    try {
      const saved = localStorage.getItem("nobif4k_api_base");
      if (saved && typeof saved === "string") {
        const clean = saved.trim().replace(/\/+$/, "");
        // If saved points to localhost but we are on mobile / live domain, ignore it to prevent timeout
        const isClientLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (!isClientLocal && (clean.includes("localhost") || clean.includes("127.0.0.1"))) {
          localStorage.removeItem("nobif4k_api_base");
        } else if (clean) {
          return clean.endsWith("/nobif4k") ? clean : `${clean}/nobif4k`;
        }
      }
    } catch (_) {}

    // 3. Localhost client dev fallback
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      const envUrl = import.meta.env?.VITE_API_URL;
      if (envUrl) return envUrl.trim().replace(/\/+$/, "");
      return "http://localhost:3001/api/nobif4k";
    }
  }

  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return PRODUCTION_API;
}

export const DEFAULT_BASE = resolveApiBase();

export class ApiError extends Error {
  constructor(message, { status = 500, code = "API_ERROR", hint = null, response = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.hint = hint;
    this.response = response;
  }
}

async function callApi(endpoint, { method = "GET", body = null, baseUrl = null, timeout = 35000, signal = null } = {}) {
  const base = baseUrl || DEFAULT_BASE;
  const url = `${base}${endpoint}`;
  const controller = new AbortController();

  let isAborted = false;
  if (signal) {
    signal.addEventListener("abort", () => {
      isAborted = true;
      controller.abort();
    });
  }

  const timer = setTimeout(() => {
    isAborted = true;
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : null,
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new ApiError(`Server returned invalid JSON (${response.status}).`, { status: response.status, code: "BAD_JSON" });
    }

    if (!response.ok) {
      throw new ApiError(payload.error || `HTTP ${response.status}: ${payload.message || "Request failed"}`, {
        status: response.status,
        code: payload.code || "HTTP_ERROR",
        hint: payload.hint || null,
        response: payload,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === "AbortError") {
      throw new ApiError(
        "Koneksi backend timeout (waktu habis). Pastikan server backend cPanel aktif di " + base,
        { status: 504, code: "TIMEOUT" }
      );
    }
    throw new ApiError(`Koneksi gagal: ${error?.message || error}. Periksa koneksi internet atau status backend.`, {
      status: 0,
      code: "NETWORK_ERROR",
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth({ baseUrl, timeout = 6000 } = {}) {
  return callApi("/health", { baseUrl, timeout });
}

export async function inspectUrl(url, { baseUrl } = {}) {
  return callApi("/inspect-url", { method: "POST", body: { url }, baseUrl });
}

export async function parseDocument(imageBase64, { targetFields = [], recommendedMode = null, sourceUrl = null, sessionCode = null, baseUrl, signal = null } = {}) {
  return callApi("/parse-document", {
    method: "POST",
    body: { imageBase64, targetFields, recommendedMode, sourceUrl, sessionCode },
    baseUrl,
    timeout: 50000,
    signal,
  });
}

export async function updateSession(code, { data, recommendedMode, sourceUrl, baseUrl } = {}) {
  return callApi(`/session/${code}`, { method: "PUT", body: { data, recommendedMode, sourceUrl }, baseUrl });
}

export async function getSession(code, { baseUrl } = {}) {
  return callApi(`/session/${code}`, { baseUrl });
}

export function getDefaultBaseUrl() {
  return resolveApiBase();
}
