import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PAGE_SIZE,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  TICKETS_API,
  buildQuery,
  clock,
  label,
  usePoll,
} from "../lib/tickets.js";
import {
  ErrorNote,
  PadNumber,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  inputClass,
  secondaryButton,
} from "../components/ui.jsx";
import { useSession } from "../lib/auth.js";
import { PLAYBOOK } from "../lib/playbook.js";
import Icon from "../components/Icon.jsx";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const FILTER_KEYS = ["status", "priority", "category", "assigned", "q"];

// Saved views across the top of the pad. Each is a complete filter set; counts come from the server.
const VIEWS = [
  { id: "active", text: "All active", filters: { status: "active" } },
  { id: "reply", text: "Needs a reply", filters: { status: "open", assigned: "unassigned" } },
  { id: "mine", text: "Assigned to me", filters: { status: "active", assigned: "me" } },
  { id: "urgent", text: "Urgent", filters: { status: "active", priority: "urgent" } },
  { id: "waiting", text: "Waiting on customer", filters: { status: "waiting_on_customer" } },
];
const EMPTY = { status: "", priority: "", category: "", assigned: "", q: "" };

const sameFilters = (a, b) => FILTER_KEYS.every((k) => (a[k] || "") === (b[k] || ""));

export default function Inbox() {
  const [params, setParams] = useSearchParams();
  const user = useSession()?.user;
  const firstName = (user?.name || user?.email || "there").split(/[\s@]/)[0];
  // Default view: everything still active, most urgent first (the server sorts)
  const filters = {
    status: "active",
    ...Object.fromEntries(
      FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined]).filter(([, v]) => v !== undefined)
    ),
  };
  const page = Math.max(Number(params.get("page")) || 0, 0);
  const [data, setData] = useState({ results: [], count: 0 });
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(filters.q || "");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const query = buildQuery(filters, { limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const load = async () => {
    const res = await apiGet(`${TICKETS_API}?${query}`);
    if (!alive.current) return;
    setLoading(false);
    if (res.ok) {
      setData({
        results: res.data.results ?? res.data,
        count: res.data.count ?? (res.data.results ?? res.data).length,
      });
      setError("");
    } else setError(res.error);
  };

  useEffect(() => {
    // Refetch when the query changes; polling is handled by usePoll below
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  usePoll(load);

  // How many tickets sit in each saved view (one tiny request per view)
  const loadCounts = useCallback(async () => {
    const entries = await Promise.all(
      VIEWS.map(async (v) => {
        const res = await apiGet(`${TICKETS_API}?${buildQuery(v.filters, { limit: 1 })}`);
        const n = res.ok ? (res.data.count ?? (res.data.results ?? res.data).length) : undefined;
        return [v.id, n];
      })
    );
    if (alive.current) setCounts(Object.fromEntries(entries));
  }, []);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);
  usePoll(loadCounts, 15000);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries({ page: undefined, ...patch })) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  // "All" for status must be remembered as an explicit choice, so it is stored as "all" and sent as nothing
  const statusValue = params.get("status") ?? "active";
  const pages = Math.max(Math.ceil(data.count / PAGE_SIZE), 1);
  const currentView = VIEWS.find((v) => sameFilters(filters, v.filters));
  const filtered = !currentView;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-carbon">
              Queue
            </h1>
            <p className="mt-1 text-sm text-muted">
              {greeting()}, {firstName}.{" "}
              {loading ? (
                "Loading the queue…"
              ) : (
                <>
                  <span className="tnum font-semibold text-ink">{data.count}</span>{" "}
                  {data.count === 1 ? "ticket" : "tickets"} in this view.
                </>
              )}
            </p>
          </div>
        </div>

        <nav
          aria-label="Saved views"
          className="mt-5 flex gap-1 overflow-x-auto border-b border-line-strong"
        >
          {VIEWS.map((v) => {
            const on = currentView?.id === v.id;
            const n = counts[v.id];
            return (
              <button
                key={v.id}
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => {
                  setSearch("");
                  update({ ...EMPTY, ...v.filters });
                }}
                className={`relative -mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-[5px] border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  on
                    ? "border-line-strong border-b-sheet bg-sheet text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {v.text}
                {n !== undefined && (
                  <span
                    className={`tnum text-[12px] font-bold ${
                      v.id === "urgent" && n > 0 ? "text-urgent" : on ? "text-carbon" : "text-faint"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="rounded-b-[6px] border border-t-0 border-line-strong bg-sheet shadow-[var(--shadow-sheet)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <form
              role="search"
              className="relative min-w-0 flex-1 basis-64"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: search.trim() });
              }}
            >
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              />
              <input
                aria-label="Search tickets"
                type="search"
                placeholder="Search number, subject, store or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} w-full pl-9`}
              />
            </form>
            <div className="grid w-full grid-cols-2 gap-2 sm:contents [&>select]:min-w-0">
              <Select
                name="Status"
                value={statusValue}
                onChange={(v) => update({ status: v })}
                options={[
                  ["active", "Active"],
                  ["all", "All statuses"],
                  ...STATUSES.map((s) => [s, label(STATUS_LABEL, s)]),
                ]}
              />
              <Select
                name="Priority"
                value={params.get("priority") ?? ""}
                onChange={(v) => update({ priority: v })}
                options={[
                  ["", "Any priority"],
                  ...PRIORITIES.map((p) => [p, label(PRIORITY_LABEL, p)]),
                ]}
              />
              <Select
                name="Category"
                value={params.get("category") ?? ""}
                onChange={(v) => update({ category: v })}
                options={[
                  ["", "Any category"],
                  ...CATEGORIES.map((c) => [c, label(CATEGORY_LABEL, c)]),
                ]}
              />
              <Select
                name="Assigned"
                value={params.get("assigned") ?? ""}
                onChange={(v) => update({ assigned: v })}
                options={[
                  ["", "Anyone"],
                  ["me", "Assigned to me"],
                  ["unassigned", "Unassigned"],
                ]}
              />
            </div>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  update({ ...EMPTY, status: "" });
                }}
                className="inline-flex items-center gap-1 rounded-[5px] px-2 py-2 text-sm font-medium text-carbon hover:underline"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="px-4 pt-4">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          <div
            aria-hidden="true"
            className="hidden grid-cols-[8.5rem_minmax(0,1fr)_11rem_6.5rem_10.5rem_1rem] gap-4 border-b border-line bg-wash px-5 py-2 text-[12px] font-semibold text-muted lg:grid"
          >
            <span>Ticket</span>
            <span>Subject and requester</span>
            <span>Status</span>
            <span>Priority</span>
            <span>How it arrived</span>
            <span />
          </div>

          {loading ? (
            <ul aria-label="Loading tickets">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="perf flex animate-pulse items-center gap-6 px-5 py-4">
                  <span className="h-3.5 w-20 rounded-sm bg-ink/[0.07]" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3.5 w-2/5 rounded-sm bg-ink/[0.07]" />
                    <span className="block h-3 w-3/5 rounded-sm bg-ink/[0.05]" />
                  </span>
                </li>
              ))}
            </ul>
          ) : data.results.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Icon name="inbox" className="h-7 w-7 text-faint" />
              <p className="mt-3 text-[15px] font-bold">
                {currentView?.id === "reply" ? "Nobody is waiting for a reply" : "No tickets match"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {currentView?.id === "reply"
                  ? "Every open ticket has someone on it. New escalations from the assistant land here first."
                  : "Try a different search, or clear the filters to see the whole active queue."}
              </p>
              {filtered && (
                <button
                  type="button"
                  className={`${secondaryButton} mt-4`}
                  onClick={() => {
                    setSearch("");
                    update({ ...EMPTY, status: "" });
                  }}
                >
                  Show all active tickets
                </button>
              )}
            </div>
          ) : (
            <ul aria-label="Tickets">
              {data.results.map((t) => (
                <li key={t.id} className="perf last:bg-none">
                  <Link
                    to={`/tickets/${t.id}`}
                    className="group relative grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-[background-color,box-shadow] hover:bg-wash focus-visible:z-10 focus-visible:bg-sheet focus-visible:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:-outline-offset-2 lg:grid-cols-[8.5rem_minmax(0,1fr)_11rem_6.5rem_10.5rem_1rem]"
                  >
                    <span className="flex items-baseline gap-3 lg:block">
                      <PadNumber value={t.ticketNumber} className="text-[13px]" />
                      <span className="tnum block text-[12px] text-faint lg:mt-0.5">
                        {clock(t.updatedAt)}
                      </span>
                    </span>
                    <span className="col-start-1 min-w-0 lg:col-start-auto">
                      <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
                        {t.subject}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted">
                        <span className="font-medium text-ink/80">{t.store?.name}</span>
                        <span className="truncate">{t.user?.email || "Former user"}</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon
                            name={t.assignedTo ? "userCheck" : "user"}
                            className="h-3.5 w-3.5 text-faint"
                          />
                          {t.assignedTo ? t.assignedTo.name : "Unassigned"}
                        </span>
                        {t.lastSender === "owner" && (
                          <span className="inline-flex items-center gap-1 font-bold text-carbon">
                            <Icon name="mail" className="h-3.5 w-3.5" />
                            Customer replied last
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="col-start-1 flex flex-wrap items-center gap-x-4 gap-y-1 lg:contents">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <SourceBadge source={t.source} />
                    </span>
                    <Icon
                      name="chevronRight"
                      className="col-start-2 row-span-3 row-start-1 h-4 w-4 text-line-strong transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muted lg:col-start-auto lg:row-span-1 lg:row-start-auto"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted">
            <button
              className={secondaryButton}
              disabled={page === 0}
              onClick={() => update({ page: page - 1 || "" })}
            >
              <Icon name="chevronLeft" className="h-4 w-4" />
              Previous
            </button>
            <span className="tnum">
              Page {page + 1} of {pages}
            </span>
            <button
              className={secondaryButton}
              disabled={page + 1 >= pages}
              onClick={() => update({ page: page + 1 })}
            >
              Next
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-5 xl:sticky xl:top-20">
        <section className="rounded-[6px] border border-line-strong bg-sheet shadow-[var(--shadow-sheet)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-bold">Common problems</h2>
            <Link
              to="/problems"
              className="text-[13px] font-semibold text-carbon underline-offset-2 hover:underline"
            >
              All {PLAYBOOK.length}
            </Link>
          </div>
          <ul>
            {PLAYBOOK.slice(0, 7).map((p) => (
              <li key={p.id} className="perf last:bg-none">
                <Link
                  to={`/problems#${p.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-2.5 text-[13.5px] leading-snug text-ink/85 transition-colors hover:bg-wash hover:text-ink"
                >
                  <span>{p.problem}</span>
                  <Icon name="chevronRight" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Before you reply"
          className="ruled rounded-[6px] border border-office-edge bg-office px-4 pb-4 pt-3"
        >
          <h2 className="flex items-center gap-2 text-[13px] font-bold">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Before you reply
          </h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[13px] leading-[24px] text-ink/85 marker:font-semibold">
            <li>Read the assistant's copy first, so the merchant never repeats themselves.</li>
            <li>Join the chat to take a ticket, then reply or leave an office note.</li>
            <li>Raise priority to Urgent when checkout or orders are down.</li>
          </ol>
        </section>
      </aside>
    </div>
  );
}

function Select({ name, value, onChange, options }) {
  return (
    <select
      aria-label={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
