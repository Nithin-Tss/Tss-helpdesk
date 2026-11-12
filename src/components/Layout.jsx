import { useCallback, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import { signOut } from "../lib/api.js";
import { SUMMARY_API, usePoll } from "../lib/tickets.js";
import Icon from "./Icon.jsx";
import { Avatar, Logo, secondaryButton } from "./ui.jsx";

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
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">
              TSS <span className="font-normal text-stone-500">Helpdesk</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-medium transition ${
                  isActive
                    ? "bg-ink text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-ink"
                }`
              }
            >
              <Icon name="inbox" className="h-4 w-4" />
              Tickets
            </NavLink>
            {waiting > 0 && (
              <span
                title="Open and unassigned"
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/15"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {waiting} waiting
              </span>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden items-center gap-2.5 pr-1 sm:flex">
              <Avatar
                name={user?.name || user?.email}
                size="h-8 w-8"
                tone="bg-accent/15 text-accent-deep"
              />
              <span className="text-stone-600">{user?.email}</span>
            </span>
            <button type="button" onClick={signOut} className={secondaryButton}>
              <Icon name="logout" className="h-4 w-4 text-stone-500" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
