import { useState } from "react";
import { signIn } from "../lib/api.js";
import Icon from "../components/Icon.jsx";
import { ErrorNote, Logo, inputClass, primaryButton } from "../components/ui.jsx";

const POINTS = [
  ["sparkles", "Every ticket arrives with the assistant's summary and chat."],
  ["inbox", "One queue for AI escalations, human requests and help-center forms."],
  ["lock", "Staff-only access, protected by your authenticator."],
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <Logo tone="bg-white text-ink" />
          <span className="text-[15px] font-semibold tracking-tight">
            TSS <span className="font-normal text-white/60">Helpdesk</span>
          </span>
        </div>
        <div>
          <h2 className="display max-w-md text-5xl leading-[1.05]">
            Pick up where the assistant left off.
          </h2>
          <ul className="mt-10 max-w-md space-y-5">
            {POINTS.map(([icon, text]) => (
              <li key={text} className="flex items-start gap-3.5 text-[15px] text-white/70">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent">
                  <Icon name={icon} className="h-4 w-4" />
                </span>
                <span className="pt-1 leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">Internal tool · for TSS support agents only</p>
      </aside>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            <Logo className="mb-6 h-10 w-10 text-2xl" />
          </div>
          <div>
            <h1 className="display text-4xl">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in with your support agent account.
            </p>
          </div>
          <label className="block text-sm font-medium">
            Email
            <span className="relative mt-1.5 block">
              <Icon
                name="mail"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                required
                autoComplete="username"
                value={form.email}
                onChange={set("email")}
                className={`${inputClass} w-full py-2.5 pl-10`}
              />
            </span>
          </label>
          <label className="block text-sm font-medium">
            Password
            <span className="relative mt-1.5 block">
              <Icon
                name="lock"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={set("password")}
                className={`${inputClass} w-full py-2.5 pl-10`}
              />
            </span>
          </label>
          {needCode && (
            <label className="block text-sm font-medium">
              Authenticator code
              <span className="relative mt-1.5 block">
                <Icon
                  name="shield"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={form.mfaCode}
                  onChange={set("mfaCode")}
                  className={`${inputClass} w-full py-2.5 pl-10 tracking-widest`}
                />
              </span>
            </label>
          )}
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" disabled={busy} className={`${primaryButton} w-full py-2.5`}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
