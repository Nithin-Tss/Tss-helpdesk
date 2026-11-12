import { useEffect, useRef } from "react";

// Server side: Tss-backend/apps/helpdesk (staff_views.py). Keep the lists in step with Ticket in models.py.
export const TICKETS_API = "/api/v1/platform/support/tickets/";
export const SUMMARY_API = "/api/v1/platform/support/summary/";
export const AGENTS_API = "/api/v1/platform/support/agents/";

export const POLL_MS = 5000;
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
  open: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  in_progress: "bg-sky-50 text-sky-800 ring-sky-600/15",
  waiting_on_customer: "bg-amber-50 text-amber-900 ring-amber-600/20",
  resolved: "bg-stone-100 text-stone-600 ring-stone-500/15",
  closed: "bg-stone-100 text-stone-500 ring-stone-500/15",
};
export const STATUS_DOT = {
  open: "bg-emerald-500",
  in_progress: "bg-sky-500",
  waiting_on_customer: "bg-amber-500",
  resolved: "bg-stone-400",
  closed: "bg-stone-300",
};
export const PRIORITIES = ["low", "normal", "high", "urgent"];
export const PRIORITY_LABEL = { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" };
export const PRIORITY_TONE = {
  low: "bg-stone-50 text-stone-500 ring-stone-400/20",
  normal: "bg-stone-50 text-stone-700 ring-stone-400/25",
  high: "bg-orange-50 text-orange-800 ring-orange-600/20",
  urgent: "bg-red-50 text-red-700 ring-red-600/20",
};
export const PRIORITY_DOT = {
  low: "bg-stone-300",
  normal: "bg-stone-400",
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
