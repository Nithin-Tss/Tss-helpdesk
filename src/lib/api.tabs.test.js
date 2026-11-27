import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Two tabs of the same browser: separate copies of api.js (each with its own in-tab state),
// sharing one localStorage and one Web Locks manager, like real tabs.
const KEY = "helpdesk_session";

function browser() {
  const store = new Map();
  const window = new EventTarget();
  window.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  let tail = Promise.resolve();
  const locks = {
    request: (_name, task) => {
      const run = tail.then(() => task());
      tail = run.catch(() => {});
      return run;
    },
  };
  return { window, locks };
}

// Backend stand-in that rotates refresh tokens like apps/core/tokens.py: a used refresh token
// coming back ends the whole sign-in.
function backend() {
  let n = 1;
  let live = true;
  const access = () => `access-${n}`;
  const fetch = vi.fn(async (url, init) => {
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status });
    if (url.endsWith("/api/v1/auth/refresh/")) {
      await new Promise((r) => setTimeout(r, 5)); // a real round trip, so the tabs overlap
      const { refresh } = JSON.parse(init.body);
      if (!live || refresh !== `refresh-${n}`) {
        live = false;
        return reply({ detail: "Session expired." }, 401);
      }
      n += 1;
      return reply({ access: access(), refresh: `refresh-${n}` });
    }
    const ok = live && init.headers.Authorization === `Bearer ${access()}`;
    return ok ? reply({ ok: true }) : reply({ detail: "expired" }, 401);
  });
  return { fetch };
}

async function openTab() {
  vi.resetModules();
  return import("./api.js");
}

const refreshCalls = (fetch) =>
  fetch.mock.calls.filter(([url]) => url.endsWith("/api/v1/auth/refresh/")).length;

describe("two admin tabs in the same browser", () => {
  let server;
  beforeEach(() => {
    const { window, locks } = browser();
    vi.stubGlobal("window", window);
    vi.stubGlobal("navigator", { locks });
    server = backend();
    vi.stubGlobal("fetch", server.fetch);
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ token: "access-1", refresh: "refresh-1", user: { email: "a@b.c" } })
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("both tabs hit an expired token together: one refresh, both stay signed in", async () => {
    const tab1 = await openTab();
    const tab2 = await openTab();
    // Make access-1 stale for the server without moving the live refresh token
    server.fetch.mockImplementationOnce(async () => new Response("{}", { status: 401 }));
    server.fetch.mockImplementationOnce(async () => new Response("{}", { status: 401 }));

    const [a, b] = await Promise.all([tab1.apiGet("/api/v1/x/"), tab2.apiGet("/api/v1/y/")]);

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(refreshCalls(server.fetch)).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(KEY))).toMatchObject({
      token: "access-2",
      refresh: "refresh-2",
    });
  });

  it("tab 1 refreshes, then tab 2 navigates: tab 2 uses the new tokens without refreshing", async () => {
    const tab1 = await openTab();
    const tab2 = await openTab();
    server.fetch.mockImplementationOnce(async () => new Response("{}", { status: 401 }));

    expect((await tab1.apiGet("/api/v1/x/")).ok).toBe(true);
    expect((await tab2.apiGet("/api/v1/y/")).ok).toBe(true);
    expect(refreshCalls(server.fetch)).toBe(1);
    expect(window.localStorage.getItem(KEY)).not.toBeNull();
  });

  it("tab 2's request was already in flight with the old token when tab 1 refreshed", async () => {
    const tab1 = await openTab();
    const tab2 = await openTab();
    let releaseTab2;
    // Tab 2's request leaves with access-1 and its 401 comes back only after tab 1 refreshed
    server.fetch.mockImplementationOnce(
      () => new Promise((r) => (releaseTab2 = () => r(new Response("{}", { status: 401 }))))
    );
    server.fetch.mockImplementationOnce(async () => new Response("{}", { status: 401 }));

    const pending = tab2.apiGet("/api/v1/y/");
    expect((await tab1.apiGet("/api/v1/x/")).ok).toBe(true);
    releaseTab2();

    expect((await pending).ok).toBe(true);
    expect(refreshCalls(server.fetch)).toBe(1);
  });
});
