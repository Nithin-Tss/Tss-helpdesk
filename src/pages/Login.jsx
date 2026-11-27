import { useState } from "react";
import { signIn } from "../lib/api.js";
import Icon from "../components/Icon.jsx";
import Background from "../components/Background.jsx";
import { ErrorNote, Wordmark, inputClass, primaryButton } from "../components/ui.jsx";

// An illustrative ticket, shown as the three copies an agent works with. Example content, not real data.
const COPIES = [
  {
    paper: "border-assistant-edge bg-assistant",
    tilt: "-rotate-[2.5deg] translate-x-6",
    icon: "sparkles",
    title: "Assistant's copy",
    body: "Merchant added live Razorpay keys this morning. Checkout now fails at payment. Test mode worked.",
  },
  {
    paper: "ruled border-office-edge bg-office",
    tilt: "rotate-[1.5deg] -translate-x-2",
    icon: "lock",
    title: "Office note, not sent",
    body: "Webhook secret is blank in payment settings. Ask them to paste it again.",
  },
  {
    paper: "border-white bg-white",
    tilt: "-rotate-[0.5deg] translate-x-3",
    icon: "send",
    title: "Reply to merchant",
    body: "We checked your Razorpay setup: the webhook secret is missing. Could you paste it under Settings, Payments? Checkout will work right after.",
    carbon: true,
  },
];

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", mfaCode: "" });
  const [needCode, setNeedCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn({
      email: form.email.trim(),
      password: form.password,
      mfaCode: needCode ? form.mfaCode.trim() : "",
    });
    setBusy(false);
    if (res.ok) return; // the session changed; App shows the inbox
    if (res.mfaRequired) setNeedCode(true);
    setError(res.error);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Background />
      <aside className="relative z-10 hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 text-white lg:flex">
        <Wordmark />
        <div>
          <h2 className="max-w-md text-[40px] font-extrabold leading-[1.08] tracking-[-0.025em]">
            Pick up where the assistant left off.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
            Every ticket arrives with the assistant's copy of the problem, so you start from what
            the merchant already said. Notes stay in the office; replies go to the merchant.
          </p>
          <ol aria-label="Example ticket" className="mt-10 max-w-md space-y-[-2px]">
            {COPIES.map((c) => (
              <li
                key={c.title}
                className={`relative rounded-[6px] border px-5 py-4 text-ink shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] ${c.paper} ${c.tilt}`}
              >
                <p
                  className={`flex items-center gap-1.5 text-[12px] font-bold ${c.carbon ? "text-carbon" : ""}`}
                >
                  <Icon name={c.icon} className="h-3.5 w-3.5" />
                  {c.title}
                </p>
                <p
                  className={`mt-1 text-[14px] leading-[1.55] ${c.carbon ? "text-carbon" : "text-ink/85"}`}
                >
                  {c.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[12px] text-white/40">Example ticket</p>
        </div>
        <p className="text-[12px] text-white/45">Internal tool for TSS support staff</p>
      </aside>

      <div className="relative z-10 flex items-center justify-center px-5 py-12">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-[6px] border border-line-strong bg-sheet p-7 shadow-[var(--shadow-lift)]"
        >
          <div className="mb-6 lg:hidden">
            <Wordmark tone="dark" />
          </div>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-carbon">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted">Use your support agent account.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-[13px] font-semibold">
              Email
              <span className="relative mt-1.5 block">
                <Icon
                  name="mail"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={form.email}
                  onChange={set("email")}
                  className={`${inputClass} w-full py-2.5 pl-9`}
                />
              </span>
            </label>
            <label className="block text-[13px] font-semibold">
              Password
              <span className="relative mt-1.5 block">
                <Icon
                  name="lock"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set("password")}
                  className={`${inputClass} w-full py-2.5 pl-9`}
                />
              </span>
            </label>
            {needCode && (
              <label className="block text-[13px] font-semibold">
                Authenticator code
                <span className="relative mt-1.5 block">
                  <Icon
                    name="shield"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                  />
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    value={form.mfaCode}
                    onChange={set("mfaCode")}
                    className={`${inputClass} tnum w-full py-2.5 pl-9 tracking-[0.3em]`}
                  />
                </span>
              </label>
            )}
            <ErrorNote>{error}</ErrorNote>
            <button type="submit" disabled={busy} className={`${primaryButton} w-full py-2.5`}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
