import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { apiGet, signOut } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import { SUMMARY_API, usePoll } from "../lib/tickets.js";
import Background from "./Background.jsx";
import Icon from "./Icon.jsx";
import { Avatar, Wordmark } from "./ui.jsx";

const navClass = ({ isActive }) =>
  `relative inline-flex h-14 items-center gap-2 whitespace-nowrap px-1 text-sm font-semibold transition-colors ${
    isActive
      ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-office"
      : "text-white/60 hover:text-white"
  }`;

export default function Layout() {
  const session = useSession();
  const [waiting, setWaiting] = useState(0);
  const refresh = useCallback(async () => {
    const res = await apiGet(SUMMARY_API);
    if (res.ok) setWaiting(res.data.openUnassigned || 0);
  }, []);
  useEffect(() => {
    // First count on load; polling keeps it fresh after that
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);
  usePoll(refresh, 15000);
  const user = session?.user;

  return (
    <div className="relative min-h-screen">
      <Background />
      <header className="sticky top-0 z-20 bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-4 px-4 sm:gap-8 sm:px-6">
          <Link to="/" aria-label="TSS Helpdesk, queue" className="rounded-[5px]">
            <Wordmark compact />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5 sm:gap-7">
            <NavLink to="/" end className={navClass}>
              Queue
            </NavLink>
            <NavLink to="/problems" className={navClass}>
              Common problems
            </NavLink>
          </nav>
          {waiting > 0 && (
            <Link
              to="/?status=open&assigned=unassigned"
              title="Open tickets nobody has picked up"
              className="hidden items-center gap-2 rounded-[5px] px-2 py-1 text-[13px] font-semibold text-office transition-colors hover:bg-white/10 md:inline-flex"
            >
              <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-office px-1 text-[12px] font-bold text-ink">
                {waiting}
              </span>
              waiting for a person
            </Link>
          )}
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-2.5 lg:flex">
              <Avatar
                name={user?.name || user?.email}
                size="h-7 w-7"
                tone="bg-white/12 text-white"
              />
              <span className="text-white/75">{user?.email}</span>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-[90rem] px-4 pb-16 pt-7 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
