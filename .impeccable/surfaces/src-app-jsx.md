---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets:
  ["src/pages/Inbox.jsx", "src/pages/Ticket.jsx", "src/pages/Login.jsx", "src/pages/Problems.jsx"]
---

# Surface brief: TSS Helpdesk app (all screens)

Scope: the whole helpdesk app (Login, Queue, Ticket, Common problems). Mode: Operate.
Audience: TSS support executives on long shifts working an escalation queue. Job: understand the merchant's problem without re-asking and send a correct reply fast.
Constraints: UI only; React 19 + Tailwind 4; keep every behaviour, API call and copy fact. User asked for no AI slop and an interactive background.

## Direction contract

THESIS: The helpdesk is a duplicate book. Every message is a copy on a specific paper: white is the customer copy, yellow is the office copy that never leaves the pad, pink is the assistant's copy. It refuses the SaaS dashboard banner, stat-card row and frosted glass.

OWN-WORLD: Pale warm-grey desk ground (#f3f1ec), white pad sheets with hairline borders, near-black ink bar (#20201e), carbon-blue ink (#1d2b6b) for numbers, headings and the primary action, office yellow (#fff4b8) for internal, assistant pink (#f9d7dd) for AI. Dashed perforations between queue stubs. Public Sans throughout, tabular figures. Status keeps its own hues as text plus icon.

STORY: The agent sees the queue as numbered stubs, picks the next one, reads the pink assistant copy first, then the thread, then writes on the white customer copy or flips the composer to the yellow office copy for a note.

FIRST VIEWPORT: Ink top bar (wordmark, Queue, Common problems, waiting count, user, sign out). Left column: "Queue" title with count, view tabs with live counts, filters, the pad of stubs each led by "No. 000014". Right 21rem column: common problems and handling notes.

FORM: Duplicate Book, IMPECCABLE'S PICK (grounded #1), seed:ffa8f58583e7e408. Signature move: the composer's paper switches white/yellow with reply/note; interactive background is pad ruling that darkens under the cursor and takes a fading carbon trace.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
