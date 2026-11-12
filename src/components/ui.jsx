import {
  PRIORITY_DOT,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  SOURCE_ICON,
  SOURCE_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_TONE,
  label,
} from "../lib/tickets.js";
import Icon from "./Icon.jsx";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-1";

export const inputClass =
  "field rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-ink shadow-[0_1px_0_rgba(17,24,39,0.02)] transition placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:outline-none focus:ring-4 focus:ring-ink/5 disabled:opacity-60";
export const primaryButton = `inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
export const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;

const pill =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset";

export const StatusBadge = ({ status }) => (
  <span
    className={`${pill} ${STATUS_TONE[status] || "bg-stone-100 text-stone-600 ring-stone-500/15"}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || "bg-stone-400"}`} />
    {label(STATUS_LABEL, status)}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span
    className={`${pill} ${PRIORITY_TONE[priority] || "bg-stone-50 text-stone-600 ring-stone-400/20"}`}
  >
    {priority === "urgent" || priority === "high" ? (
      <Icon name="flag" className="h-3 w-3" />
    ) : (
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority] || "bg-stone-400"}`} />
    )}
    {label(PRIORITY_LABEL, priority)}
  </span>
);

export const SourceBadge = ({ source }) => (
  <span className={`${pill} bg-white text-stone-600 ring-stone-300/70`}>
    <Icon name={SOURCE_ICON[source] || "tag"} className="h-3 w-3 text-accent-deep" />
    {label(SOURCE_LABEL, source)}
  </span>
);

const initials = (text) =>
  String(text || "?")
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// Soft monogram tile for a store, person or agent
export const Avatar = ({ name, size = "h-10 w-10", tone = "bg-stone-100 text-stone-600" }) => (
  <span
    aria-hidden="true"
    className={`flex shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold ${size} ${tone}`}
  >
    {initials(name)}
  </span>
);

export const Logo = ({ className = "h-9 w-9 text-[22px]", tone = "bg-ink text-white" }) => (
  <span
    aria-hidden="true"
    className={`display flex shrink-0 items-center justify-center rounded-[10px] pb-0.5 ${tone} ${className}`}
  >
    S
  </span>
);

export const SectionTitle = ({ icon, children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
    {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
    {children}
  </h2>
);

export const ErrorNote = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-200"
    >
      <Icon name="alert" className="mt-0.5 h-4 w-4 text-red-600" />
      <span>{children}</span>
    </p>
  ) : null;
