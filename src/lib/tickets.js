import { useEffect, useRef } from "react";
import { API_URL } from "./api.js";
import { getSession } from "./auth.js";

// Server side: Tss-backend/apps/helpdesk (staff_views.py). Keep the lists in step with Ticket in models.py.
export const TICKETS_API = "/api/v1/platform/support/tickets/";
export const SUMMARY_API = "/api/v1/platform/support/summary/";
export const AGENTS_API = "/api/v1/platform/support/agents/";

export const POLL_MS = 5000;
export const SLOW_POLL_MS = 30000; // safety net while the live stream is working
export const MAX_ATTACHMENTS = 3;
export const MAX_REPLY = 2000;
export const PAGE_SIZE = 25;

export const STATUSES = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
export const STATUS_LABEL = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_customer: "Waiting on customer",
  resolved: "Resolved",
  closed: "Closed",
};
export const STATUS_TONE = {
  open: "text-emerald-700",
  in_progress: "text-indigo-700",
  waiting_on_customer: "text-amber-700",
  resolved: "text-slate-500",
  closed: "text-slate-400",
};
export const STATUS_ICON = {
  open: "circle",
  in_progress: "progress",
  waiting_on_customer: "pause",
  resolved: "checkCircle",
  closed: "archive",
};
export const STATUS_DOT = {
  open: "bg-emerald-500",
  in_progress: "bg-sky-500",
  waiting_on_customer: "bg-amber-500",
  resolved: "bg-slate-400",
  closed: "bg-slate-300",
};
export const PRIORITIES = ["low", "normal", "high", "urgent"];
export const PRIORITY_LABEL = { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" };
export const PRIORITY_TONE = {
  low: "text-slate-400",
  normal: "text-slate-500",
  high: "text-orange-600",
  urgent: "text-red-600",
};
export const PRIORITY_DOT = {
  low: "bg-slate-300",
  normal: "bg-slate-400",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};
export const CATEGORIES = ["payments", "shipping", "domains", "themes", "account", "other"];
export const CATEGORY_LABEL = {
  payments: "Payments",
  shipping: "Shipping",
  domains: "Domains",
  themes: "Themes",
  account: "Account",
  other: "Other",
};
export const SOURCE_LABEL = {
  ai_escalation: "Escalated by AI",
  customer_request: "Asked for a human",
  help_center: "Help Center form",
};

export const SOURCE_ICON = {
  ai_escalation: "sparkles",
  customer_request: "hand",
  help_center: "book",
};

export const label = (map, key) => map[key] || String(key ?? "");

// Query string for the list. filters = { status, priority, category, assigned, q } ("" = no filter).
export function buildQuery(filters = {}, { limit, offset } = {}) {
  const params = new URLSearchParams();
  for (const key of ["status", "priority", "category", "assigned"])
    if (filters[key]) params.set(key, filters[key]);
  if (String(filters.q ?? "").trim()) params.set("q", String(filters.q).trim());
  if (limit != null) params.set("limit", limit);
  if (offset != null) params.set("offset", offset);
  return params.toString();
}

// -> "" when the message can be sent, else why not
export function validateReply(message) {
  const text = String(message ?? "").trim();
  if (!text) return "Write a message.";
  if (text.length > MAX_REPLY) return `Keep your message under ${MAX_REPLY + 1} characters.`;
  return "";
}

export function buildReplyPayload({ message, attachments, status, internal }) {
  const payload = { message: String(message ?? "").trim() };
  if (internal) return { ...payload, internal: true };
  if (attachments?.length) payload.attachments = attachments;
  if (status) payload.status = status;
  return payload;
}

export function clock(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return time;
  const day = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
  return `${day}, ${time}`;
}

// Calls `callback` every `ms` while enabled and the tab is visible; skips a tick while the last call still runs.
export function usePoll(callback, ms = POLL_MS, enabled = true) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    let busy = false;
    const tick = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        await latest.current();
      } finally {
        busy = false;
      }
    };
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms, enabled]);
}

function streamHeaders() {
  const token = getSession()?.token;
  return { Accept: "text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// Live updates: keeps a Server-Sent Events stream open for one ticket (over fetch, which can send the sign-in
// headers) and calls `onChange` the moment the server says the ticket changed, and once after every (re)connect so
// nothing sent in between is missed. Reconnects by itself. Polling stays on as a slow safety net.
export function useTicketLive(eventsPath, onChange, enabled = true) {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (!enabled || !eventsPath || typeof fetch === "undefined") return undefined;
    let stopped = false;
    let controller = null;
    let after = "";
    let failures = 0;

    async function connect() {
      while (!stopped) {
        controller = new AbortController();
        try {
          const response = await fetch(`${API_URL}${eventsPath}${after ? `?after=${after}` : ""}`, {
            headers: streamHeaders(),
            signal: controller.signal,
          });
          if (response.status === 401) {
            await latest.current(); // an ordinary request refreshes the sign-in; then reconnect
            throw new Error("sign-in expired");
          }
          if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
          failures = 0;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let cut;
            while ((cut = buffer.indexOf("\n\n")) >= 0) {
              const chunk = buffer.slice(0, cut);
              buffer = buffer.slice(cut + 2);
              let event = "message";
              for (const line of chunk.split("\n")) {
                if (line.startsWith("id:")) after = line.slice(3).trim();
                else if (line.startsWith("event:")) event = line.slice(6).trim();
              }
              if (event === "hello" || event === "ticket") latest.current();
            }
          }
        } catch {
          if (stopped) return;
          failures += 1;
        }
        if (!stopped) await new Promise((r) => setTimeout(r, Math.min(500 * 2 ** failures, 15000)));
      }
    }

    connect();
    return () => {
      stopped = true;
      controller?.abort();
    };
  }, [eventsPath, enabled]);
}
