import { useState } from "react";
import { signIn } from "../lib/api.js";
import { ErrorNote, inputClass, primaryButton } from "../components/ui.jsx";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight">TSS Helpdesk</h1>
          <p className="text-sm text-slate-500">Sign in with your support agent account.</p>
        </div>
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={form.email}
            onChange={set("email")}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={set("password")}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        {needCode && (
          <label className="block text-sm font-medium">
            Authenticator code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={form.mfaCode}
              onChange={set("mfaCode")}
              className={`${inputClass} mt-1 w-full`}
            />
          </label>
        )}
        <ErrorNote>{error}</ErrorNote>
        <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
