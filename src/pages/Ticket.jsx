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
  ErrorNote,
  PadNumber,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  inputClass,
  primaryButton,
} from "../components/ui.jsx";
import Icon from "../components/Icon.jsx";
import { ReplyBox, Thread } from "../components/Conversation.jsx";
import Playbook from "../components/Playbook.jsx";

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
  const [insert, setInsert] = useState(null);
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
  if (!ticket)
    return (
      <div aria-label="Loading ticket" className="max-w-3xl animate-pulse space-y-3">
        <span className="block h-4 w-24 rounded-sm bg-ink/[0.07]" />
        <span className="block h-7 w-2/3 rounded-sm bg-ink/[0.08]" />
        <span className="block h-28 rounded-[6px] bg-ink/[0.05]" />
      </div>
    );

  const joined = Boolean(ticket.assignedTo);
  const customerName = ticket.user?.name || ticket.user?.email || "Merchant";
  const details = [
    ["Store", ticket.store?.name],
    ["Store ID", ticket.store?.id],
    ...(ticket.user
      ? [...(ticket.user.name ? [["Name", ticket.user.name]] : []), ["Email", ticket.user.email]]
      : [["Requester", "Former user"]]),
    ["Created", clock(ticket.createdAt)],
    ...(ticket.resolvedAt ? [["Resolved", clock(ticket.resolvedAt)]] : []),
  ];

  const useReply = (text) => {
    setMode("reply");
    setInsert({ id: Date.now(), text });
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
      <div className="min-w-0 space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-[5px] text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          Queue
        </Link>

        <section className="rounded-[6px] border border-line-strong bg-sheet shadow-[var(--shadow-sheet)]">
          <div className="px-5 pb-4 pt-5 sm:px-6">
            <PadNumber value={ticket.ticketNumber} className="text-sm" />
            <h1 className="mt-1 break-words text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-carbon">
              {ticket.subject}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <SourceBadge source={ticket.source} />
              <span className="tnum inline-flex items-center gap-1.5 text-[13px] text-muted">
                <Icon name="clock" className="h-4 w-4" />
                Opened {clock(ticket.createdAt)}
              </span>
            </p>
          </div>
          <div className="grid gap-3 border-t border-line bg-wash px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {joined ? (
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
            ) : (
              <div className="text-[12px] font-semibold text-muted">
                Assigned to
                <button
                  type="button"
                  disabled={busy || !me}
                  onClick={() =>
                    change({
                      assignedTo: me,
                      status: ticket.status === "open" ? "in_progress" : undefined,
                    })
                  }
                  className={`${primaryButton} mt-1 w-full`}
                >
                  <Icon name="userCheck" className="h-4 w-4" />
                  Join chat
                </button>
              </div>
            )}
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
          {error && (
            <div className="border-t border-line px-5 py-3 sm:px-6">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </section>

        {ticket.summary && (
          <section
            aria-label="What the assistant gathered"
            className="rounded-[6px] border border-assistant-edge bg-assistant px-5 py-4 sm:px-6"
          >
            <h2 className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <Icon name="sparkles" className="h-4 w-4" />
              Assistant's copy: what it gathered
            </h2>
            <p className="mt-1.5 max-w-[72ch] whitespace-pre-wrap break-words text-[15px] leading-[1.6] text-ink">
              {ticket.summary}
            </p>
          </section>
        )}

        <section
          aria-label="Conversation"
          className="rounded-[6px] border border-line-strong bg-sheet shadow-[var(--shadow-sheet)]"
        >
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-[13px] font-bold sm:px-6">
            <Icon name="headset" className="h-4 w-4 text-muted" />
            Conversation with {customerName}
          </h2>
          <div className="px-5 py-5 sm:px-6">
            {ticket.transcript?.length > 0 && (
              <>
                <ol aria-label="Chat with the assistant" className="space-y-3">
                  {ticket.transcript.map((turn, i) => {
                    const isCustomer = turn.role === "user";
                    return (
                      <li
                        key={i}
                        className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                      >
                        <span className="mb-1 px-0.5 text-[12px] font-semibold text-muted">
                          {isCustomer ? customerName : "Assistant"}
                        </span>
                        <div
                          className={`max-w-[min(85%,42rem)] whitespace-pre-wrap break-words rounded-[6px] px-4 py-2.5 text-[14px] leading-[1.55] ${
                            isCustomer
                              ? "border border-line bg-wash text-ink"
                              : "border border-assistant-edge bg-assistant text-ink"
                          }`}
                        >
                          {turn.content}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <div
                  role="separator"
                  className="my-6 flex items-center gap-3 text-[12px] font-bold text-carbon"
                >
                  <span className="perf h-px flex-1" />
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="userCheck" className="h-3.5 w-3.5" />
                    Handed to the team
                  </span>
                  <span className="perf h-px flex-1" />
                </div>
              </>
            )}
            {ticket.messages.length === 0 ? (
              !ticket.transcript?.length && <p className="text-sm text-muted">No messages yet.</p>
            ) : (
              <Thread messages={ticket.messages} />
            )}
          </div>

          {!joined ? (
            <p className="flex items-center gap-2 border-t border-line bg-wash px-5 py-4 text-sm text-muted sm:px-6">
              <Icon name="info" className="h-4 w-4 shrink-0" />
              <span>
                Use <strong className="font-semibold text-ink">Join chat</strong> above to take this
                ticket and reply to the merchant.
              </span>
            </p>
          ) : (
            <div className="border-t border-line px-5 pb-5 pt-4 sm:px-6">
              <div role="tablist" aria-label="What you are writing" className="mb-3 flex gap-1">
                {[
                  ["reply", "Reply to merchant", "send"],
                  ["note", "Office note", "lock"],
                ].map(([id, text, icon]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={mode === id}
                    onClick={() => setMode(id)}
                    className={`inline-flex items-center gap-2 rounded-[5px] border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      mode === id
                        ? id === "note"
                          ? "border-office-edge bg-office text-ink"
                          : "border-carbon/40 bg-carbon/[0.06] text-carbon"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    <Icon name={icon} className="h-3.5 w-3.5" />
                    {text}
                  </button>
                ))}
                <span className="ml-auto hidden self-center text-[12px] text-muted sm:block">
                  {mode === "note"
                    ? "Only support staff see office notes. The merchant is not notified."
                    : "The merchant sees this on their support page and by email."}
                </span>
              </div>
              <ReplyBox
                key={mode}
                onSend={send}
                uploadUrl={`${base}attachments/`}
                allowImages={mode === "reply"}
                note={mode === "note"}
                insert={insert}
              >
                {mode === "reply" && (
                  <label className="flex items-center gap-2 text-sm text-muted">
                    Then mark as
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
          )}
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-20">
        <section
          aria-label="Store and requester"
          className="rounded-[6px] border border-line-strong bg-sheet shadow-[var(--shadow-sheet)]"
        >
          <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-[13px] font-bold">
            <Icon name="store" className="h-4 w-4 text-muted" />
            Store and requester
          </h2>
          <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3 text-[13px]">
            {details.map(([k, v]) => (
              <Fragment key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="tnum break-words font-medium">{v}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
        <Playbook
          key={ticket.category}
          category={ticket.category === "other" ? "all" : ticket.category}
          onInsert={joined ? useReply : undefined}
        />
      </aside>
    </div>
  );
}

function Field({ name, children }) {
  return (
    <label className="text-[12px] font-semibold text-muted">
      {name}
      <div className="mt-1">{children}</div>
    </label>
  );
}
