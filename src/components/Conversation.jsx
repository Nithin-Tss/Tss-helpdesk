import { useEffect, useRef, useState } from "react";
import { apiUpload } from "../lib/api.js";
import { MAX_ATTACHMENTS, MAX_REPLY, clock, validateReply } from "../lib/tickets.js";
import Icon from "./Icon.jsx";
import { Avatar, ErrorNote, inputClass, primaryButton, secondaryButton } from "./ui.jsx";

// The customer's messages come in on the left; ours (staff) are on the right. Internal notes are yellow.
export function Thread({ messages }) {
  const end = useRef(null);
  const seen = useRef(null);
  useEffect(() => {
    if (seen.current !== null && messages.length > seen.current)
      end.current?.scrollIntoView?.({ block: "end", behavior: "smooth" });
    seen.current = messages.length;
  }, [messages.length]);

  return (
    <ol className="space-y-4" aria-label="Conversation">
      {messages.map((m) => {
        const ours = m.senderType === "staff";
        const tone = m.isInternal
          ? "bg-amber-50 text-slate-900 ring-1 ring-inset ring-amber-200"
          : ours
            ? "bg-ink text-white"
            : "bg-slate-100 text-ink";
        const metaTone = ours && !m.isInternal ? "text-white/60" : "text-slate-500";
        return (
          <li key={m.id} className={`flex items-end gap-2.5 ${ours ? "flex-row-reverse" : ""}`}>
            <Avatar
              name={m.senderName}
              size="h-8 w-8"
              tone={ours ? "bg-accent/15 text-accent-deep" : "bg-slate-100 text-slate-600"}
            />
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${tone} ${ours ? "rounded-br-md" : "rounded-bl-md"}`}
            >
              <p className={`flex items-center gap-1.5 text-xs ${metaTone}`}>
                {m.isInternal && <Icon name="lock" className="h-3 w-3" />}
                {m.isInternal ? "Internal note · " : ""}
                {m.senderName} · {clock(m.createdAt)}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
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
                          className="h-20 w-20 rounded-lg object-cover ring-1 ring-black/5"
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
export function ReplyBox({ onSend, uploadUrl, allowImages = true, insert, children }) {
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
        className={`${inputClass} w-full resize-y py-3 leading-relaxed`}
        placeholder="Write a message… (Ctrl + Enter to send)"
      />
      {images.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {images.map((i) => (
            <li key={i.id} className="relative">
              <img
                src={i.url}
                alt={i.name || "Image"}
                className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200"
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
              <Icon name="paperclip" className="h-4 w-4 text-slate-500" />
              {uploading ? "Uploading…" : "Attach image"}
            </button>
          </>
        )}
        {children}
        <button type="submit" disabled={busy || uploading} className={`${primaryButton} ml-auto`}>
          <Icon name="send" className="h-4 w-4" />
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      <ErrorNote>{error}</ErrorNote>
    </form>
  );
}
