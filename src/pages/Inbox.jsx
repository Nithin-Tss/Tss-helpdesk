import { useEffect, useRef, useState } from "react";
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
  Avatar,
  ErrorNote,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  inputClass,
  secondaryButton,
} from "../components/ui.jsx";
import Icon from "../components/Icon.jsx";

const FILTER_KEYS = ["status", "priority", "category", "assigned", "q"];

export default function Inbox() {
  const [params, setParams] = useSearchParams();
  // Default view: everything still active, most urgent first (the server sorts)
  const filters = {
    status: "active",
    ...Object.fromEntries(
      FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined]).filter(([, v]) => v !== undefined)
    ),
  };
  const page = Math.max(Number(params.get("page")) || 0, 0);
  const [data, setData] = useState({ results: [], count: 0 });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl text-ink">Tickets</h1>
          <p className="mt-1 text-sm text-stone-500">
            {loading
              ? "Loading the queue…"
              : `${data.count} ${data.count === 1 ? "ticket" : "tickets"} in this view`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() });
          }}
        >
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          />
          <input
            aria-label="Search"
            placeholder="Search number, subject, store, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-80 max-w-full pl-10`}
          />
        </form>
        <Select
          name="Status"
          value={statusValue}
          onChange={(v) => update({ status: v })}
          options={[
            ["active", "Active"],
            ["all", "All"],
            ...STATUSES.map((s) => [s, label(STATUS_LABEL, s)]),
          ]}
        />
        <Select
          name="Priority"
          value={params.get("priority") ?? ""}
          onChange={(v) => update({ priority: v })}
          options={[["", "Any priority"], ...PRIORITIES.map((p) => [p, label(PRIORITY_LABEL, p)])]}
        />
        <Select
          name="Category"
          value={params.get("category") ?? ""}
          onChange={(v) => update({ category: v })}
          options={[["", "Any category"], ...CATEGORIES.map((c) => [c, label(CATEGORY_LABEL, c)])]}
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

      <ErrorNote>{error}</ErrorNote>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04),0_8px_24px_-12px_rgba(17,24,39,0.08)] ring-1 ring-stone-200/80">
        {loading ? (
          <ul aria-hidden="true" className="divide-y divide-stone-100">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
                <span className="h-10 w-10 rounded-xl bg-stone-100" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3.5 w-1/3 rounded bg-stone-100" />
                  <span className="block h-3 w-1/2 rounded bg-stone-100" />
                </span>
              </li>
            ))}
          </ul>
        ) : data.results.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <Icon name="inbox" className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">No tickets match</p>
            <p className="mt-1 max-w-xs text-sm text-stone-500">
              Try a different search or loosen the filters to see more of the queue.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.results.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/tickets/${t.id}`}
                  className="group relative flex items-center gap-4 px-5 py-4 transition hover:bg-stone-50/80 focus-visible:bg-stone-50 focus-visible:outline-none"
                >
                  {t.priority === "urgent" && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-red-500"
                    />
                  )}
                  <Avatar name={t.store?.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="shrink-0 font-mono text-[11.5px] font-medium tracking-tight text-stone-400">
                        {t.ticketNumber}
                      </span>
                      <span className="min-w-0 truncate text-[15px] font-medium text-ink">
                        {t.subject}
                      </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <Meta icon="store">{t.store?.name}</Meta>
                      <Meta icon="mail">{t.user?.email || "Former user"}</Meta>
                      <Meta icon={t.assignedTo ? "userCheck" : "user"}>
                        {t.assignedTo ? t.assignedTo.name : "Unassigned"}
                      </Meta>
                      <Meta icon="clock">{clock(t.updatedAt)}</Meta>
                      {t.lastSender === "owner" && (
                        <span className="font-medium text-accent-deep">Customer replied last</span>
                      )}
                    </p>
                  </div>
                  <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 md:flex">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <SourceBadge source={t.source} />
                  </div>
                  <Icon
                    name="chevronRight"
                    className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-stone-600">
          <button
            className={secondaryButton}
            disabled={page === 0}
            onClick={() => update({ page: page - 1 || "" })}
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
            Previous
          </button>
          <span>
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
  );
}

function Meta({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon name={icon} className="h-3.5 w-3.5 text-stone-400" />
      {children}
    </span>
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
