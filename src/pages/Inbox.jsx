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
  ErrorNote,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  inputClass,
} from "../components/ui.jsx";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() });
          }}
        >
          <input
            aria-label="Search"
            placeholder="Search number, subject, store, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-72`}
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : data.results.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No tickets match.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.results.map((t) => (
              <li key={t.id}>
                <Link to={`/tickets/${t.id}`} className="block px-5 py-3 hover:bg-slate-50">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold text-slate-500">{t.ticketNumber}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{t.subject}</span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <SourceBadge source={t.source} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.store?.name} · {t.user?.email || "Former user"} ·{" "}
                    {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : "Unassigned"} ·{" "}
                    {clock(t.updatedAt)}
                    {t.lastSender === "owner" && " · customer replied last"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
            disabled={page === 0}
            onClick={() => update({ page: page - 1 || "" })}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {pages}
          </span>
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
            disabled={page + 1 >= pages}
            onClick={() => update({ page: page + 1 })}
          >
            Next
          </button>
        </div>
      )}
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
