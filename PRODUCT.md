# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Support executives (primary):** TSS staff who pick up tickets escalated from the merchant help assistant and talk to the merchant until the problem is solved. Sign-in requires `is_support_agent` or `is_owner` (checked by the backend on every call).
- **Owners:** TSS platform owners, who have the same access.
- The "customer" in this app is a **merchant** (a store owner using TSS Shop), not a shopper.

## Product Purpose

The internal helpdesk where escalated merchant conversations get resolved by a person. Success means an executive understands the problem without re-asking anything and sends a correct reply fast.

## Positioning

It carries out the TSS Shop promise that "a human is always one step away" (see `../Tss-shop/PRODUCT.md`). A ticket arrives with the AI assistant's summary and the whole chat so far, so the human starts where the AI stopped.

## Operating Context

- Flow: merchant → help assistant (AI) → not satisfied / "Talk to a human" → ticket → helpdesk executive → reply → merchant's "My support tickets" page (polls every 5 s) and email when configured.
- Screens: Inbox (ticket queue), Ticket (conversation with the merchant), Common problems (playbook), Login.
- Playbook (`src/lib/playbook.js`): per-problem checks for the agent plus a ready-to-copy reply, insertable straight into a ticket. Categories: payments, shipping, domains, themes, account, other.
- Used for long shifts, working through a queue; scanning and speed matter more than expression.

## Capabilities and Constraints

- UI only; everything is served by Tss-backend (`apps/helpdesk`, `/api/v1/platform/support/*`).
- React 19, React Router 7, Vite, Tailwind CSS 4. Dev server on port 5174.
- Playbook text is editable content: `checks` are internal to the agent, and `reply` is customer-facing.

## Brand Commitments

- Name: **TSS Helpdesk**.
- Replies to merchants use the plain, courteous, specific voice of the playbook replies: say what was checked, what happens next, and ask for one concrete thing.

## Product Principles

1. **Never make the merchant repeat themselves.** The AI summary and prior chat lead every ticket.
2. **Queue first.** What needs a reply next, and how long it has waited, should always be clear.
3. **Help the agent be right, quickly.** Checks and ready-made replies sit beside the conversation, not in another tool.
4. **Internal stays internal.** Never confuse agent-only notes and checks with what the merchant will see.
