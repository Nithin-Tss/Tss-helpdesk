import { useState } from "react";
import { PLAYBOOK } from "../lib/playbook.js";
import { CATEGORIES, CATEGORY_LABEL, label } from "../lib/tickets.js";
import Icon from "./Icon.jsx";
import { SectionTitle, inputClass } from "./ui.jsx";

/*
 * Sidebar of the most common customer problems with likely causes and a ready reply.
 * On a ticket, pass `category` to start on that topic and `onInsert` to drop a reply into the message box.
 */
export default function Playbook({ category = "all", onInsert }) {
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
      className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] ring-1 ring-slate-200/80"
    >
      <SectionTitle icon="book">Common problems</SectionTitle>
      <div className="relative mt-3">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          aria-label="Search common problems"
          placeholder="Search problems"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} w-full pl-9`}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["all", ...CATEGORIES.filter((c) => PLAYBOOK.some((p) => p.category === c))].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={topic === c}
            onClick={() => setTopic(c)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              topic === c
                ? "bg-ink text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-ink"
            }`}
          >
            {c === "all" ? "All" : label(CATEGORY_LABEL, c)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Nothing matches. Try another word.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
          {items.map((p) => {
            const isOpen = open === p.id;
            return (
              <li key={p.id} id={p.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className="flex w-full items-start justify-between gap-2 py-3 text-left text-sm font-medium text-ink transition hover:text-accent-deep"
                >
                  <span>{p.problem}</span>
                  <Icon
                    name="chevronDown"
                    className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-4 text-[13px] leading-relaxed text-slate-600">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Check
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4">
                      {p.checks.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Suggested reply
                    </p>
                    <p className="mt-1.5 rounded-lg bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-200/70">
                      {p.reply}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {onInsert && (
                        <button
                          type="button"
                          onClick={() => onInsert(p.reply)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-accent-deep"
                        >
                          <Icon name="send" className="h-3.5 w-3.5" />
                          Use in reply
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copy(p)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                      >
                        <Icon name={copied === p.id ? "check" : "note"} className="h-3.5 w-3.5" />
                        {copied === p.id ? "Copied" : "Copy"}
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
