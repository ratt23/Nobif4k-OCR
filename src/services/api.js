const PRODUCTION_API = "https://graphicat.site/api/nobif4k";

function resolveApiBase() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const apiParam = params.get("api");
    if (apiParam) {
      let clean = apiParam.trim().replace(/\/+$/, "");
      return clean.endsWith("/nobif4k") ? clean : `${clean}/nobif4k`;
    }
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

const DEFAULT_BASE = resolveApiBase();

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

async function callApi(endpoint, { method = "GET", body = null, baseUrl = null, timeout = 30000 } = {}) {
  const base = baseUrl || DEFAULT_BASE;
  const url = `${base}${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

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
      throw new ApiError(payload.error || `HTTP ${response.status}`, {
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
      throw new ApiError("Request timed out. Check backend connectivity.", { status: 504, code: "TIMEOUT" });
    }
    throw new ApiError(`Network error: ${error?.message || error}`, { status: 0, code: "NETWORK_ERROR" });
  } finally {
    clearTimeout(timer);
  }
}

export async function inspectUrl(url, { baseUrl } = {}) {
  return callApi("/inspect-url", { method: "POST", body: { url }, baseUrl });
}

export async function parseDocument(imageBase64, { targetFields = [], recommendedMode = null, sourceUrl = null, sessionCode = null, baseUrl } = {}) {
  return callApi("/parse-document", {
    method: "POST",
    body: { imageBase64, targetFields, recommendedMode, sourceUrl, sessionCode },
    baseUrl,
    timeout: 60000,
  });
}

export async function updateSession(code, { data, recommendedMode, sourceUrl, baseUrl } = {}) {
  return callApi(`/session/${code}`, { method: "PUT", body: { data, recommendedMode, sourceUrl }, baseUrl });
}

export async function getSession(code, { baseUrl } = {}) {
  return callApi(`/session/${code}`, { baseUrl });
}

export function getDefaultBaseUrl() {
  return DEFAULT_BASE;
}
