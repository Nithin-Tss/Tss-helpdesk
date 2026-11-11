import { useSyncExternalStore } from "react";

// Session = { token (access JWT), refresh, user }. Only support staff may hold one here (see signIn in api.js).
const KEY = "helpdesk_session";
const EVENT = "helpdesk-session-change";

let cache = { raw: undefined, value: null };

export function getSession() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* storage blocked: behave as signed out */
  }
  if (raw !== cache.raw) {
    let value = null;
    try {
      value = raw ? JSON.parse(raw) : null;
    } catch {
      value = null;
    }
    cache = { raw, value };
  }
  return cache.value;
}

export function setSession(session) {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // other tabs
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

export const useSession = () => useSyncExternalStore(subscribe, getSession, () => null);
