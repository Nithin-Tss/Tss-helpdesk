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

export const inputClass =
  "field rounded-[5px] border border-line-strong bg-sheet px-3 py-2 text-sm text-ink transition-colors placeholder:text-faint hover:border-muted/60 focus:border-carbon focus:outline-none focus:ring-2 focus:ring-carbon/15 disabled:cursor-not-allowed disabled:opacity-60";

// Carbon ink: the one filled action on a screen
export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[5px] bg-carbon px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(20_31_82/0.3)] transition-[background-color,transform] hover:bg-carbon-deep active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[5px] border border-line-strong bg-sheet px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-muted/70 hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45";

export const quietButton =
  "inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-sm font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink";

const flat = "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold";

export const StatusBadge = ({ status }) => (
  <span className={`${flat} ${STATUS_TONE[status] || "text-muted"}`}>
    <Icon name={STATUS_ICON[status] || "circle"} className="h-4 w-4" />
    {label(STATUS_LABEL, status)}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span
    className={`${flat} ${PRIORITY_TONE[priority] || "text-muted"} ${priority === "normal" || priority === "low" ? "font-medium" : ""}`}
  >
    <Icon
      name={priority === "urgent" || priority === "high" ? "flag" : "signal"}
      className="h-4 w-4"
    />
    {label(PRIORITY_LABEL, priority)}
  </span>
);

export const SourceBadge = ({ source }) => (
  <span className={`${flat} font-medium text-muted`}>
    <Icon name={SOURCE_ICON[source] || "tag"} className="h-4 w-4" />
    {label(SOURCE_LABEL, source)}
  </span>
);

// "TSS-000014" -> { prefix: "TSS-", digits: "000014" }, so the pad number can lead in carbon
export const splitNumber = (value) => {
  const text = String(value ?? "");
  const m = text.match(/^(.*?)(\d+)$/);
  return m ? { prefix: m[1], digits: m[2] } : { prefix: "", digits: text };
};

export const PadNumber = ({ value, className = "" }) => {
  const { digits } = splitNumber(value);
  return (
    <span className={`tnum font-bold text-carbon ${className}`} title={value}>
      <span className="font-medium text-carbon/75">No.</span> {digits}
    </span>
  );
};

const initials = (text) =>
  String(text || "?")
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export const Avatar = ({ name, size = "h-8 w-8", tone = "bg-ink/[0.06] text-ink" }) => (
  <span
    aria-hidden="true"
    className={`flex shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${size} ${tone}`}
  >
    {initials(name)}
  </span>
);

// The pad: three offset sheets, white over yellow over pink, the way a duplicate book's copies stack
export const Logo = ({ className = "h-8 w-8" }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
    <rect x="9" y="3" width="20" height="24" rx="2" fill="#f9d7dd" />
    <rect x="6" y="5.5" width="20" height="24" rx="2" fill="#fff4b8" />
    <rect x="3" y="8" width="20" height="22" rx="2" fill="#ffffff" />
    <path d="M7 15h12M7 19.5h12M7 24h7" stroke="#1d2b6b" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 12.5h20" stroke="#1d2b6b" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
  </svg>
);

export const Wordmark = ({ tone = "light", compact = false }) => (
  <span className="flex items-center gap-2.5">
    <Logo />
    <span
      className={`whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] ${tone === "light" ? "text-white" : "text-ink"} ${compact ? "hidden sm:inline" : ""}`}
    >
      TSS{" "}
      <span className={`font-medium ${tone === "light" ? "text-white/65" : "text-muted"}`}>
        Helpdesk
      </span>
    </span>
  </span>
);

export const SectionTitle = ({ icon, children, className = "" }) => (
  <h2 className={`flex items-center gap-2 text-[13px] font-bold text-ink ${className}`}>
    {icon && <Icon name={icon} className="h-4 w-4 text-muted" />}
    {children}
  </h2>
);

export const ErrorNote = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-[5px] border border-urgent/30 bg-[#fbeceb] px-4 py-3 text-sm text-[#7a1a14]"
    >
      <Icon name="alert" className="mt-0.5 h-4 w-4 text-urgent" />
      <span>{children}</span>
    </p>
  ) : null;
