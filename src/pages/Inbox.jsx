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
  SectionTitle,
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
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-ink p-7 text-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.6)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/50 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-white/60">
                {greeting()}, {firstName}
              </p>
              <h1 className="display mt-1 text-3xl">Tickets</h1>
              <p className="mt-1.5 text-sm text-white/70">
                {loading
                  ? "Loading the queue…"
                  : `${data.count} ${data.count === 1 ? "ticket" : "tickets"} in this view`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["Needs a reply", "inbox", { status: "open", assigned: "unassigned" }],
                ["Assigned to me", "userCheck", { status: "active", assigned: "me" }],
                ["Urgent", "flag", { status: "active", priority: "urgent" }],
              ].map(([text, icon, patch]) => (
                <button
                  key={text}
                  type="button"
                  onClick={() =>
                    update({
                      status: "active",
                      assigned: "",
                      priority: "",
                      category: "",
                      q: "",
                      ...patch,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <Icon name={icon} className="h-4 w-4 text-white/70" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Tickets", data.count, "inbox", "text-accent-deep bg-accent/10"],
            [
              "Unassigned",
              data.results.filter((t) => !t.assignedTo).length,
              "user",
              "text-amber-700 bg-amber-50",
            ],
            [
              "Urgent",
              data.results.filter((t) => t.priority === "urgent").length,
              "flag",
              "text-red-700 bg-red-50",
            ],
            [
              "Customer replied",
              data.results.filter((t) => t.lastSender === "owner").length,
              "mail",
              "text-emerald-700 bg-emerald-50",
            ],
          ].map(([text, n, icon, tone]) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/80"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold leading-none tabular-nums">
                  {loading ? "–" : n}
                </p>
                <p className="mt-1 text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
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
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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

        <ErrorNote>{error}</ErrorNote>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)] ring-1 ring-slate-200/80">
          {loading ? (
            <ul aria-hidden="true" className="divide-y divide-slate-100">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
                  <span className="h-10 w-10 rounded-md bg-slate-100" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3.5 w-1/3 rounded bg-slate-100" />
                    <span className="block h-3 w-1/2 rounded bg-slate-100" />
                  </span>
                </li>
              ))}
            </ul>
          ) : data.results.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon name="inbox" className="h-6 w-6" />
              </span>
              <p className="mt-4 text-[15px] font-semibold">No tickets match</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Try a different search or loosen the filters to see more of the queue.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.results.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tickets/${t.id}`}
                    className="group relative flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                  >
                    {t.priority === "urgent" && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-0.5 bg-red-500"
                      />
                    )}
                    <Avatar name={t.store?.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2.5">
                        <span className="shrink-0 text-[11.5px] font-medium tabular-nums tracking-tight text-slate-400">
                          {t.ticketNumber}
                        </span>
                        <span className="min-w-0 truncate text-[15px] font-medium text-ink">
                          {t.subject}
                        </span>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <Meta icon="store">{t.store?.name}</Meta>
                        <Meta icon="mail">{t.user?.email || "Former user"}</Meta>
                        <Meta icon={t.assignedTo ? "userCheck" : "user"}>
                          {t.assignedTo ? t.assignedTo.name : "Unassigned"}
                        </Meta>
                        <Meta icon="clock">{clock(t.updatedAt)}</Meta>
                        {t.lastSender === "owner" && (
                          <span className="font-medium text-accent-deep">
                            Customer replied last
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="hidden shrink-0 items-center justify-end gap-5 md:flex">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <SourceBadge source={t.source} />
                    </div>
                    <Icon
                      name="chevronRight"
                      className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-end gap-3 text-sm text-slate-600">
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
      <aside className="space-y-5 xl:sticky xl:top-24">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between">
            <SectionTitle icon="book">Common problems</SectionTitle>
            <Link to="/problems" className="text-xs font-medium text-accent-deep hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {PLAYBOOK.slice(0, 7).map((p) => (
              <li key={p.id}>
                <Link
                  to={`/problems#${p.id}`}
                  className="flex items-start justify-between gap-2 py-2.5 text-sm text-slate-700 transition hover:text-accent-deep"
                >
                  <span>{p.problem}</span>
                  <Icon name="chevronRight" className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl bg-accent/10 p-5 ring-1 ring-accent/25">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-accent-deep">
            <Icon name="sparkles" className="h-4 w-4" />
            Handling tips
          </h2>
          <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-slate-700">
            <li>
              Read the assistant's summary before replying so the customer never repeats themselves.
            </li>
            <li>Click Join chat to take a ticket, then reply or leave an internal note.</li>
            <li>Raise priority to Urgent when checkout or orders are down.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

function Meta({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon name={icon} className="h-3.5 w-3.5 text-slate-400" />
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
