import { PRIORITY_LABEL, PRIORITY_TONE, SOURCE_LABEL, STATUS_LABEL, STATUS_TONE, label } from "../lib/tickets.js";

export const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60";
export const primaryButton =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60";
export const secondaryButton =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60";

const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export const StatusBadge = ({ status }) => (
  <span className={`${pill} ${STATUS_TONE[status] || "bg-slate-100 text-slate-600"}`}>{label(STATUS_LABEL, status)}</span>
);
export const PriorityBadge = ({ priority }) => (
  <span className={`${pill} ${PRIORITY_TONE[priority] || "bg-slate-100 text-slate-600"}`}>
    {label(PRIORITY_LABEL, priority)}
  </span>
);
export const SourceBadge = ({ source }) => (
  <span className={`${pill} bg-violet-50 text-violet-700`}>{label(SOURCE_LABEL, source)}</span>
);

export const ErrorNote = ({ children }) =>
  children ? (
    <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </p>
  ) : null;
