import { useEffect, useRef, useState } from "react";
import { apiUpload } from "../lib/api.js";
import { MAX_ATTACHMENTS, MAX_REPLY, clock, validateReply } from "../lib/tickets.js";
import Icon from "./Icon.jsx";
import { Avatar, ErrorNote, inputClass, primaryButton, secondaryButton } from "./ui.jsx";

// Each message is a copy on its own paper: the merchant's on plain stock (left), ours in carbon (right),
// office notes on yellow. The paper, the side and the label all say who wrote it and who can see it.
export function Thread({ messages }) {
  const end = useRef(null);
  const seen = useRef(null);
  useEffect(() => {
    if (seen.current !== null && messages.length > seen.current)
      end.current?.scrollIntoView?.({ block: "end", behavior: "smooth" });
    seen.current = messages.length;
  }, [messages.length]);

  return (
    <ol className="space-y-3" aria-label="Conversation">
      {messages.map((m) => {
        const ours = m.senderType === "staff";
        const paper = m.isInternal
          ? "ruled border border-office-edge bg-office text-ink"
          : ours
            ? "border border-carbon/25 bg-sheet text-carbon shadow-[var(--shadow-sheet)]"
            : "border border-line bg-wash text-ink";
        const metaTone = ours && !m.isInternal ? "text-carbon/80" : "text-muted";
        return (
          <li key={m.id} className={`flex items-start gap-2.5 ${ours ? "flex-row-reverse" : ""}`}>
            <Avatar
              name={m.senderName}
              size="h-7 w-7"
              tone={ours ? "bg-carbon/10 text-carbon" : "bg-ink/[0.07] text-ink"}
            />
            <div className={`max-w-[min(80%,42rem)] rounded-[6px] px-4 py-3 ${paper}`}>
              <p className={`flex flex-wrap items-center gap-x-1.5 text-[12px] ${metaTone}`}>
                {m.isInternal && (
                  <span className="inline-flex items-center gap-1 font-bold text-ink">
                    <Icon name="lock" className="h-3 w-3" />
                    Office note, not sent
                  </span>
                )}
                {ours && !m.isInternal && (
                  <span className="inline-flex items-center gap-1 font-bold text-carbon">
                    <Icon name="send" className="h-3 w-3" />
                    Reply to merchant
                  </span>
                )}
                <span className={m.isInternal ? "" : "font-semibold"}>{m.senderName}</span>
                <span aria-hidden="true">·</span>
                <span className="tnum">{clock(m.createdAt)}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-[14.5px] leading-[1.6]">
                {m.body}
              </p>
              {m.attachments?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {m.attachments.map((a, i) => (
                    <li key={a.id || a.url || i}>
                      <a href={a.url} target="_blank" rel="noreferrer noopener">
                        <img
                          src={a.url}
                          alt={a.name || "Attachment"}
                          className="h-20 w-20 rounded-[4px] object-cover ring-1 ring-ink/10"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
      <li ref={end} aria-hidden="true" />
    </ol>
  );
}

// Reply box. onSend({ message, attachments: [ids] }) -> { ok, error? }. Cleared only when the send worked.
export function ReplyBox({
  onSend,
  uploadUrl,
  allowImages = true,
  insert,
  note = false,
  children,
}) {
  const [text, setText] = useState("");
  // Text pushed in from the sidebar (insert = { id, text }); applied once per id while rendering
  const [applied, setApplied] = useState(insert?.id);
  if (insert && insert.id !== applied) {
    setApplied(insert.id);
    setText((t) => (t.trim() ? `${t.trimEnd()}\n\n${insert.text}` : insert.text));
  }
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const input = useRef(null);

  const pick = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_ATTACHMENTS - images.length);
    event.target.value = "";
    setUploading(true);
    let next = images;
    for (const file of files) {
      const res = await apiUpload(uploadUrl, "image", file);
      if (!res.ok) {
        setError(res.error);
        break;
      }
      next = [...next, res.data];
      setImages(next);
    }
    setUploading(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    const problem = validateReply(text);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    const res = await onSend({ message: text, attachments: images.map((i) => i.id) });
    setBusy(false);
    if (res.ok) {
      setText("");
      setImages([]);
    } else setError(res.error);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        aria-label="Message"
        rows={4}
        value={text}
        maxLength={MAX_REPLY + 1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
        }}
        className={`${inputClass} block w-full resize-y px-4 py-3 text-[14.5px] leading-[24px] ${
          note
            ? "ruled border-office-edge bg-office hover:border-office-edge focus:border-ink/40 focus:ring-ink/10"
            : ""
        }`}
        placeholder={
          note
            ? "Note for the team. The merchant never sees this. (Ctrl + Enter to save)"
            : "Write to the merchant… (Ctrl + Enter to send)"
        }
      />
      {images.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {images.map((i) => (
            <li key={i.id} className="relative">
              <img
                src={i.url}
                alt={i.name || "Image"}
                className="h-16 w-16 rounded-[4px] object-cover ring-1 ring-line-strong"
              />
              <button
                type="button"
                aria-label={`Remove ${i.name || "image"}`}
                onClick={() => setImages(images.filter((x) => x.id !== i.id))}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow"
              >
                <Icon name="x" className="h-3 w-3" strokeWidth="2.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {allowImages && (
          <>
            <input
              ref={input}
              type="file"
              hidden
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={pick}
              aria-label="Attach images"
            />
            <button
              type="button"
              className={secondaryButton}
              disabled={uploading || busy || images.length >= MAX_ATTACHMENTS}
              onClick={() => input.current?.click()}
            >
              <Icon name="paperclip" className="h-4 w-4 text-muted" />
              {uploading ? "Uploading…" : "Attach image"}
            </button>
          </>
        )}
        {children}
        <button
          type="submit"
          disabled={busy || uploading}
          className={`${note ? "inline-flex items-center justify-center gap-2 rounded-[5px] bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50" : primaryButton} ml-auto`}
        >
          <Icon name={note ? "lock" : "send"} className="h-4 w-4" />
          {busy ? (note ? "Saving…" : "Sending…") : note ? "Save note" : "Send to merchant"}
        </button>
      </div>
      <ErrorNote>{error}</ErrorNote>
    </form>
  );
}
