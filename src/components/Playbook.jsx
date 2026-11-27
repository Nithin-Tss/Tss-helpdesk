import { useState } from "react";
import { PLAYBOOK } from "../lib/playbook.js";
import { CATEGORIES, CATEGORY_LABEL, label } from "../lib/tickets.js";
import Icon from "./Icon.jsx";
import { SectionTitle, inputClass } from "./ui.jsx";

/*
 * Sidebar of the most common customer problems with likely causes and a ready reply.
 * On a ticket, pass `category` to start on that topic and `onInsert` to drop a reply into the message box.
 */
export default function Playbook({ category = "all", onInsert, hideTitle = false }) {
  const [topic, setTopic] = useState(category);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(() => window.location.hash.slice(1) || null);
  const [copied, setCopied] = useState(null);

  const needle = query.trim().toLowerCase();
  const items = PLAYBOOK.filter(
    (p) =>
      (topic === "all" || p.category === topic) &&
      (!needle || `${p.problem} ${p.checks.join(" ")} ${p.reply}`.toLowerCase().includes(needle))
  );

  const copy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.reply);
      setCopied(item.id);
      setTimeout(() => setCopied((c) => (c === item.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked; the reply is still visible to select */
    }
  };

  return (
    <section
      aria-label="Common problems and solutions"
      className="rounded-[6px] border border-line-strong bg-sheet shadow-[var(--shadow-sheet)]"
    >
      <div className="space-y-3 border-b border-line px-4 py-3">
        {!hideTitle && <SectionTitle icon="book">Common problems</SectionTitle>}
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          />
          <input
            aria-label="Search common problems"
            type="search"
            placeholder="Search problems"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <div role="group" aria-label="Topic" className="flex flex-wrap gap-1">
          {["all", ...CATEGORIES.filter((c) => PLAYBOOK.some((p) => p.category === c))].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={topic === c}
              onClick={() => setTopic(c)}
              className={`rounded-[4px] border px-2 py-1 text-[12.5px] font-semibold transition-colors ${
                topic === c
                  ? "border-ink bg-ink text-white"
                  : "border-line-strong text-muted hover:border-muted hover:text-ink"
              }`}
            >
              {c === "all" ? "All" : label(CATEGORY_LABEL, c)}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted">Nothing matches. Try another word.</p>
      ) : (
        <ul>
          {items.map((p) => {
            const isOpen = open === p.id;
            return (
              <li key={p.id} id={p.id} className="perf scroll-mt-20 last:bg-none">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-[14px] font-semibold leading-snug transition-colors hover:bg-wash ${isOpen ? "text-carbon" : "text-ink"}`}
                >
                  <span>{p.problem}</span>
                  <Icon
                    name="chevronDown"
                    className={`mt-0.5 h-4 w-4 shrink-0 text-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-3 px-4 pb-4 text-[13.5px] leading-relaxed">
                    <div className="ruled rounded-[5px] border border-office-edge bg-office px-3.5 py-2.5">
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
                        <Icon name="lock" className="h-3 w-3" />
                        Check first (for you only)
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 leading-[24px] text-ink/85">
                        {p.checks.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-[5px] border border-carbon/25 bg-sheet px-3.5 py-2.5">
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-carbon">
                        <Icon name="send" className="h-3 w-3" />
                        Reply to the merchant
                      </p>
                      <p className="mt-1 text-carbon">{p.reply}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {onInsert && (
                        <button
                          type="button"
                          onClick={() => onInsert(p.reply)}
                          className="inline-flex items-center gap-1.5 rounded-[5px] bg-carbon px-2.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-carbon-deep"
                        >
                          <Icon name="send" className="h-3.5 w-3.5" />
                          Use in reply
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copy(p)}
                        aria-live="polite"
                        className="inline-flex items-center gap-1.5 rounded-[5px] border border-line-strong px-2.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-wash"
                      >
                        <Icon name={copied === p.id ? "check" : "note"} className="h-3.5 w-3.5" />
                        {copied === p.id ? "Copied" : "Copy reply"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
