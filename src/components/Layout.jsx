import { useCallback, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import { signOut } from "../lib/api.js";
import { SUMMARY_API, usePoll } from "../lib/tickets.js";

export default function Layout() {
  const session = useSession();
  const [waiting, setWaiting] = useState(0);
  const refresh = useCallback(async () => {
    const res = await apiGet(SUMMARY_API);
    if (res.ok) setWaiting(res.data.openUnassigned || 0);
  }, []);
  usePoll(refresh, 15000);
  const user = session?.user;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-base font-bold tracking-tight">
            TSS Helpdesk
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`
              }
            >
              Tickets
            </NavLink>
            {waiting > 0 && (
              <span
                title="Open and unassigned"
                className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white"
              >
                {waiting} waiting
              </span>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
