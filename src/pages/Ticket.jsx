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
  STATUSES,
  STATUS_LABEL,
  TICKETS_API,
  buildReplyPayload,
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
  secondaryButton,
} from "../components/ui.jsx";
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
  usePoll(load);

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
  if (!ticket) return <p className="text-sm text-slate-500">Loading…</p>;

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
      <Link to="/" className="text-sm text-slate-600 hover:underline">
        ← All tickets
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm font-semibold text-slate-500">{ticket.ticketNumber}</span>
          <h1 className="min-w-0 break-words text-lg font-semibold tracking-tight">
            {ticket.subject}
          </h1>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <SourceBadge source={ticket.source} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          className="rounded-2xl border border-orange-200 bg-orange-50 p-5"
        >
          <h2 className="text-sm font-semibold text-orange-900">What the assistant gathered</h2>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{ticket.summary}</p>
        </section>
      )}

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium">
          Store and requester
        </summary>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-slate-200 px-5 py-3 text-sm">
          {details.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="text-slate-500">{k}</dt>
              <dd className="break-words">{v}</dd>
            </Fragment>
          ))}
        </dl>
      </details>

      {ticket.transcript?.length > 0 && (
        <details open className="rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-5 py-3 text-sm font-medium">
            Earlier chat with the assistant ({ticket.transcript.length} messages)
          </summary>
          <ol
            aria-label="AI chat transcript"
            className="max-h-80 space-y-2 overflow-y-auto border-t border-slate-200 px-5 py-3 text-sm"
          >
            {ticket.transcript.map((turn, i) => (
              <li key={i}>
                <span className="font-medium text-slate-500">
                  {turn.role === "user" ? "Customer" : "Assistant"}:{" "}
                </span>
                <span className="whitespace-pre-wrap break-words">{turn.content}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="mb-4 text-sm font-semibold">Conversation</h2>
        {ticket.messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          <Thread messages={ticket.messages} />
        )}

        <div className="mt-6 border-t border-slate-200 pt-5">
          <div role="tablist" aria-label="Reply type" className="mb-3 flex gap-1">
            {[
              ["reply", "Reply to customer"],
              ["note", "Internal note"],
            ].map(([id, text]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`rounded-lg px-3 py-1.5 text-sm ${mode === id ? "bg-slate-900 font-semibold text-white" : "hover:bg-slate-200"}`}
              >
                {text}
              </button>
            ))}
          </div>
          {mode === "note" && (
            <p className="mb-3 text-xs text-amber-800">
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
              <label className="flex items-center gap-2 text-sm text-slate-600">
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
    <label className="text-xs font-medium text-slate-500">
      {name}
      <div className="mt-1">{children}</div>
    </label>
  );
}
