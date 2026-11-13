import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  SOURCE_ICON,
  SOURCE_LABEL,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_TONE,
  label,
} from "../lib/tickets.js";
import Icon from "./Icon.jsx";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

export const inputClass =
  "field rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-ink transition placeholder:text-slate-400 hover:border-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";
export const primaryButton = `inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
export const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;

const flat = "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium";

export const StatusBadge = ({ status }) => (
  <span className={`${flat} ${STATUS_TONE[status] || "text-slate-500"}`}>
    <Icon name={STATUS_ICON[status] || "circle"} className="h-4 w-4" />
    {label(STATUS_LABEL, status)}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`${flat} ${PRIORITY_TONE[priority] || "text-slate-500"}`}>
    <Icon
      name={priority === "urgent" || priority === "high" ? "flag" : "signal"}
      className="h-4 w-4"
    />
    {label(PRIORITY_LABEL, priority)}
  </span>
);

export const SourceBadge = ({ source }) => (
  <span className={`${flat} text-slate-500`}>
    <Icon name={SOURCE_ICON[source] || "tag"} className="h-4 w-4" />
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
export const Avatar = ({ name, size = "h-10 w-10", tone = "bg-slate-100 text-slate-600" }) => (
  <span
    aria-hidden="true"
    className={`flex shrink-0 items-center justify-center rounded-md text-[13px] font-semibold ${size} ${tone}`}
  >
    {initials(name)}
  </span>
);

export const Logo = ({ className = "h-9 w-9 text-[22px]", tone = "bg-ink text-white" }) => (
  <span
    aria-hidden="true"
    className={`display flex shrink-0 items-center justify-center rounded-md pb-0.5 ${tone} ${className}`}
  >
    S
  </span>
);

export const SectionTitle = ({ icon, children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
    {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
    {children}
  </h2>
);

export const ErrorNote = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-200"
    >
      <Icon name="alert" className="mt-0.5 h-4 w-4 text-red-600" />
      <span>{children}</span>
    </p>
  ) : null;
