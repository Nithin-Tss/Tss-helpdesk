import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import {
  AGENTS_API,
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  SLOW_POLL_MS,
  STATUSES,
  STATUS_LABEL,
  TICKETS_API,
  buildReplyPayload,
  clock,
  label,
  usePoll,
  useTicketLive,
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
import Icon from "../components/Icon.jsx";
import { ReplyBox, Thread } from "../components/Conversation.jsx";

/*
 * One ticket. This is where the executive takes over from the help assistant: the AI summary and the chat the
 * customer already had with it are shown above the live conversation, so the customer never repeats themselves.
 * Refreshes every 5 seconds while the tab is visible.
 */
export default function Ticket() {
  const { ticketId } = useParams();
  return <TicketView key={ticketId} ticketId={ticketId} />;
}

function TicketView({ ticketId }) {
  const me = useSession()?.user?.id;
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("reply");
  const [after, setAfter] = useState("waiting_on_customer");
  const alive = useRef(true);
  const loaded = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const base = `${TICKETS_API}${ticketId}/`;
  const load = useCallback(async () => {
    const res = await apiGet(base);
    if (!alive.current) return;
    if (res.ok) {
      loaded.current = true;
      setTicket(res.data);
      setError("");
    } else if (!loaded.current) setError(res.error);
  }, [base]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    apiGet(AGENTS_API).then((res) => alive.current && res.ok && setAgents(res.data));
  }, [load]);
  useTicketLive(`${base}events/`, load);
  usePoll(load, SLOW_POLL_MS); // safety net; the live stream above does the real work

  const change = async (patch) => {
    setBusy(true);
    setError("");
    const res = await apiPatch(base, patch);
    if (!alive.current) return;
    setBusy(false);
    if (res.ok) setTicket(res.data);
    else setError(res.error);
  };

  const send = async ({ message, attachments }) => {
    const res = await apiPost(
      `${base}messages/`,
      buildReplyPayload({ message, attachments, status: after, internal: mode === "note" })
    );
    if (!res.ok) return { ok: false, error: res.error };
    if (alive.current) setTicket(res.data);
    return { ok: true };
  };

  if (error && !ticket) return <ErrorNote>{error}</ErrorNote>;
  if (!ticket) return <p className="text-sm text-stone-500">Loading…</p>;

  const customerName = ticket.user?.name || ticket.user?.email || "Customer";
  const details = [
    ["Store", ticket.store?.name],
    ["Store ID", ticket.store?.id],
    ...(ticket.user
      ? [...(ticket.user.name ? [["Name", ticket.user.name]] : []), ["Email", ticket.user.email]]
      : [["Requester", "Former user"]]),
    ["Created", clock(ticket.createdAt)],
    ...(ticket.resolvedAt ? [["Resolved", clock(ticket.resolvedAt)]] : []),
  ];

  return (
    <div className="space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-stone-500 transition hover:text-ink"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        All tickets
      </Link>

      <section className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_8px_24px_-12px_rgba(17,24,39,0.08)] ring-1 ring-stone-200/80">
        <div className="flex items-start gap-4">
          <Avatar name={ticket.store?.name} size="h-12 w-12" tone="bg-stone-100 text-stone-600" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-medium text-stone-400">{ticket.ticketNumber}</p>
            <h1 className="display mt-0.5 break-words text-3xl leading-tight text-ink">
              {ticket.subject}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="store" className="h-3.5 w-3.5 text-stone-400" />
                {ticket.store?.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="h-3.5 w-3.5 text-stone-400" />
                Opened {clock(ticket.createdAt)}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <SourceBadge source={ticket.source} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-stone-100 pt-5 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field name="Assigned to">
            <select
              aria-label="Assigned to"
              className={`${inputClass} w-full`}
              disabled={busy}
              value={ticket.assignedTo?.id || ""}
              onChange={(e) => change({ assignedTo: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id === me ? `${a.name} (me)` : a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field name="Status">
            <select
              aria-label="Status"
              className={`${inputClass} w-full`}
              disabled={busy}
              value={ticket.status}
              onChange={(e) => change({ status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(STATUS_LABEL, s)}
                </option>
              ))}
            </select>
          </Field>
          <Field name="Priority">
            <select
              aria-label="Priority"
              className={`${inputClass} w-full`}
              disabled={busy}
              value={ticket.priority}
              onChange={(e) => change({ priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {label(PRIORITY_LABEL, p)}
                </option>
              ))}
            </select>
          </Field>
          <Field name="Category">
            <select
              aria-label="Category"
              className={`${inputClass} w-full`}
              disabled={busy}
              value={ticket.category}
              onChange={(e) => change({ category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {label(CATEGORY_LABEL, c)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {me && ticket.assignedTo?.id !== me && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              change({
                assignedTo: me,
                status: ticket.status === "open" ? "in_progress" : undefined,
              })
            }
            className={`${secondaryButton} mt-3`}
          >
            <Icon name="userCheck" className="h-4 w-4 text-stone-500" />
            Take this ticket
          </button>
        )}
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      </section>

      {ticket.summary && (
        <section
          aria-label="AI summary"
          className="rounded-2xl bg-accent/10 p-5 ring-1 ring-accent/30"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-accent-deep">
            <Icon name="sparkles" className="h-4 w-4" />
            What the assistant gathered
          </h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-stone-800">
            {ticket.summary}
          </p>
        </section>
      )}

      <details className="group rounded-2xl bg-white ring-1 ring-stone-200/80">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Icon name="info" className="h-4 w-4 text-stone-400" />
            Store and requester
          </span>
          <Icon
            name="chevronDown"
            className="h-4 w-4 text-stone-400 transition group-open:rotate-180"
          />
        </summary>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-t border-stone-100 px-5 py-4 text-sm">
          {details.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="text-stone-500">{k}</dt>
              <dd className="break-words">{v}</dd>
            </Fragment>
          ))}
        </dl>
      </details>

      <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-200/80">
        <div className="mb-5">
          <SectionTitle icon="headset">Conversation</SectionTitle>
        </div>
        {ticket.transcript?.length > 0 && (
          <>
            <ol aria-label="AI chat transcript" className="flex flex-col gap-3 text-sm">
              {ticket.transcript.map((turn, i) => {
                const isCustomer = turn.role === "user";
                return (
                  <li
                    key={i}
                    className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                  >
                    <span className="mb-1 px-1 text-xs text-stone-500">
                      {isCustomer ? customerName : "Assistant"}
                    </span>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 ${
                        isCustomer
                          ? "rounded-tl-md bg-stone-100 text-ink"
                          : "rounded-tr-md bg-accent/15 text-stone-900 ring-1 ring-accent/25"
                      }`}
                    >
                      {turn.content}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="my-6 flex items-center gap-3 text-xs font-medium text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              Handed off to the team
              <span className="h-px flex-1 bg-stone-200" />
            </div>
          </>
        )}
        {ticket.messages.length === 0 ? (
          !ticket.transcript?.length && <p className="text-sm text-stone-500">No messages yet.</p>
        ) : (
          <Thread messages={ticket.messages} />
        )}

        <div className="mt-8 border-t border-stone-100 pt-6">
          <div
            role="tablist"
            aria-label="Reply type"
            className="mb-4 inline-flex gap-1 rounded-xl bg-stone-100 p-1"
          >
            {[
              ["reply", "Reply to customer", "send"],
              ["note", "Internal note", "note"],
            ].map(([id, text, icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm transition ${mode === id ? "bg-white font-semibold text-ink shadow-sm" : "text-stone-500 hover:text-ink"}`}
              >
                <Icon name={icon} className="h-3.5 w-3.5" />
                {text}
              </button>
            ))}
          </div>
          {mode === "note" && (
            <p className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
              <Icon name="lock" className="h-3.5 w-3.5" />
              Only support staff see internal notes. The customer is not notified.
            </p>
          )}
          <ReplyBox
            key={mode}
            onSend={send}
            uploadUrl={`${base}attachments/`}
            allowImages={mode === "reply"}
          >
            {mode === "reply" && (
              <label className="flex items-center gap-2 text-sm text-stone-600">
                After sending, mark as
                <select
                  value={after}
                  onChange={(e) => setAfter(e.target.value)}
                  className={inputClass}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(STATUS_LABEL, s)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </ReplyBox>
        </div>
      </section>
    </div>
  );
}

function Field({ name, children }) {
  return (
    <label className="text-xs font-medium text-stone-500">
      {name}
      <div className="mt-1">{children}</div>
    </label>
  );
}
