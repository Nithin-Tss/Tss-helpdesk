# Tss-helpdesk

The website support executives use. Customers start in the help assistant inside the shop admin; when the
assistant can't help (or the customer presses "Talk to a human") the backend raises a ticket with the AI's
summary and the chat so far. Executives pick it up here and talk to the customer.

```
customer (Tss-shop) → help assistant (AI) ──not satisfied──▶ ticket ──▶ Tss-helpdesk (executive) ──reply──▶ customer
```

Everything is served by Tss-backend (`apps/helpdesk`, `/api/v1/platform/support/*`); this app is only the UI.
Only users with `is_owner` or `is_support_agent` can sign in (checked again by the backend on every call).

## Run

```
cp .env.example .env     # VITE_API_URL = backend address
npm install
npm run dev              # http://localhost:5174
npm test
```

Backend: add this app's address to `CORS_ALLOWED_ORIGINS` (5174 is already in the dev default) and make a
support agent in the Django admin (User → "Is support agent").

Replies reach the customer in their "My support tickets" page in the shop (it polls every 5 s) and by email
when `SUPPORT_EMAIL`/mailers are configured.
