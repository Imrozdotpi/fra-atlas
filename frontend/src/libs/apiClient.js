// frontend/src/libs/apiClient.js
import { API_BASE } from "../config";

function normalizeBase(b) {
  const s = String(b || "").replace(/\/$/, "");
  if (!s) return "/api";
  if (s.endsWith("/api")) return s;
  if (s.includes("/api/")) return s.replace(/\/$/, "");
  return s + "/api";
}
const API = normalizeBase(API_BASE);

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fra_token");
}

export async function authFetch(urlOrPath, options = {}) {
  let finalUrl = urlOrPath;
  if (typeof urlOrPath === "string") {
    if (urlOrPath.startsWith("/")) {
      finalUrl = API + urlOrPath;
    } else if (!/^https?:\/\//i.test(urlOrPath) && !urlOrPath.startsWith(API)) {
      finalUrl = API + (urlOrPath.startsWith("/") ? urlOrPath : "/" + urlOrPath);
    }
  }

  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(finalUrl, { ...options, headers });
}

// -----------------------------
// Helpers: removeToken & fetchCurrentUser
// -----------------------------
export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fra_token");
  }
}

export async function fetchCurrentUser() {
  // ✅ always call /api/me
  const res = await authFetch("/api/me");
  if (!res.ok) {
    const err = new Error(`Failed to fetch current user: ${res.status}`);
    // attach status so callers can act on 401 specifically
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    err.status = res.status;
    throw err;
  }

  const json = await res.json().catch(() => null);
  // return .user if present, otherwise return whole object
  return json?.user ?? json ?? null;
}
