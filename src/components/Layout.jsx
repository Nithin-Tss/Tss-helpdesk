import { useCallback, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import { signOut } from "../lib/api.js";
import { SUMMARY_API, usePoll } from "../lib/tickets.js";
import Background from "./Background.jsx";
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
    <div className="relative min-h-screen">
      <Background />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-6 px-5">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">
              TSS <span className="font-normal text-slate-500">Helpdesk</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative inline-flex h-16 items-center gap-2 px-1 font-medium transition ${
                  isActive
                    ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent"
                    : "text-slate-500 hover:text-ink"
                }`
              }
            >
              <Icon name="inbox" className="h-4 w-4" />
              Tickets
            </NavLink>
            <NavLink
              to="/problems"
              className={({ isActive }) =>
                `relative inline-flex h-16 items-center gap-2 px-1 font-medium transition ${
                  isActive
                    ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent"
                    : "text-slate-500 hover:text-ink"
                }`
              }
            >
              <Icon name="book" className="h-4 w-4" />
              Common problems
            </NavLink>
            {waiting > 0 && (
              <span
                title="Open and unassigned"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-600"
              >
                <Icon name="alert" className="h-4 w-4" />
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
              <span className="text-slate-600">{user?.email}</span>
            </span>
            <button type="button" onClick={signOut} className={secondaryButton}>
              <Icon name="logout" className="h-4 w-4 text-slate-500" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-[90rem] px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
