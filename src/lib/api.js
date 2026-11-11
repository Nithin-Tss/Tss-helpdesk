import { getSession, setSession } from "./auth.js";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export const NETWORK_ERROR = "Unable to reach the server. Please try again.";

// Turns a DRF error body into one readable sentence
export function errorMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  for (const value of Object.values(data)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") return first;
  }
  return fallback;
}

// One refresh at a time; a refresh token works once, so concurrent 401s must share the same attempt.
let refreshing = null;
function refreshSession() {
  refreshing ??= (async () => {
    const session = getSession();
    if (!session?.refresh) return false;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
      });
      if (res.status === 401) {
        setSession(null);
        return false;
      }
      if (!res.ok) return false; // rate limit / server error: keep the session, fail this request only
      const tokens = await res.json();
      setSession({ ...session, token: tokens.access, refresh: tokens.refresh ?? session.refresh });
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function send(path, { method = "GET", body, form } = {}) {
  const run = () => {
    const headers = {};
    const token = getSession()?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  };
  let res = await run();
  if (res.status === 401 && getSession()?.refresh && (await refreshSession())) res = await run();
  return res;
}

async function call(path, options, fallback) {
  let res;
  try {
    res = await send(path, options);
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok) return { ok: true, status: res.status, data };
  return { ok: false, status: res.status, data, error: errorMessage(data, fallback) };
}

export const apiGet = (path) => call(path, {}, "Could not load this. Please try again.");
export const apiPost = (path, body) => call(path, { method: "POST", body }, "Could not send. Please try again.");
export const apiPatch = (path, body) => call(path, { method: "PATCH", body }, "Could not save. Please try again.");
export function apiUpload(path, field, file) {
  const form = new FormData();
  form.append(field, file);
  return call(path, { method: "POST", form }, "Upload failed. Please try again.");
}

// Sign in. Resolves { ok: true } | { ok: false, error, mfaRequired? }. Non-staff accounts are refused and not kept.
export async function signIn({ email, password, mfaCode }) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/v1/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe: false, ...(mfaCode ? { mfaCode } : {}) }),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (data?.mfaRequired) return { ok: false, mfaRequired: true, error: data.detail };
    return { ok: false, error: errorMessage(data, "Could not sign in.") };
  }
  if (!data.user?.isSupportAgent) {
    return { ok: false, error: "This account is not a support agent." };
  }
  setSession({ token: data.access, refresh: data.refresh, user: data.user });
  return { ok: true };
}

export async function signOut() {
  const refresh = getSession()?.refresh;
  setSession(null);
  if (!refresh) return;
  try {
    await fetch(`${API_URL}/api/v1/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    /* already signed out locally */
  }
}
