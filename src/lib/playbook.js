/*
 * Reference answers for the problems store owners contact support about most. Shown in the sidebar so an agent can
 * check the likely cause, then drop a ready-made reply into the box. Categories match CATEGORIES in tickets.js.
 * Edit the text freely: `checks` are for the agent, `reply` is what gets inserted for the customer.
 */
export const PLAYBOOK = [
  {
    id: "pay-not-received",
    category: "payments",
    problem: "Customer paid but the order shows unpaid",
    checks: [
      "Find the order and compare the payment time with the gateway dashboard.",
      "Pending bank or UPI payments can take up to 30 minutes to confirm.",
      "If the gateway shows success but the order is unpaid, mark it paid manually and note the reference.",
    ],
    reply:
      "Thanks for flagging this. Some payments take a few minutes to confirm with the bank. I've checked your order and will make sure it is updated. Could you share the payment reference or a screenshot of the debit so I can match it on our side?",
  },
  {
    id: "pay-refund",
    category: "payments",
    problem: "How do I refund an order?",
    checks: [
      "Open the order and choose Refund. Full and partial refunds are supported.",
      "Refunds go back to the original payment method in 5 to 7 business days.",
      "Cash on delivery orders must be refunded outside the platform.",
    ],
    reply:
      "You can refund from the order page: open the order, choose Refund, then pick the items or enter an amount. The money returns to the customer's original payment method in 5 to 7 business days. Let me know if the button is missing and I'll take a look.",
  },
  {
    id: "pay-gateway-setup",
    category: "payments",
    problem: "Payment gateway won't connect or checkout fails",
    checks: [
      "Confirm the API keys are live keys, not test keys, and have no stray spaces.",
      "Check the gateway account is fully activated (KYC complete).",
      "Ask for the exact error shown at checkout and a rough time to find it in the logs.",
    ],
    reply:
      "Sorry about the trouble with checkout. Two things usually cause this: test keys saved instead of live keys, or the gateway account still awaiting activation. Could you confirm which keys are saved and send the exact error customers see at checkout?",
  },
  {
    id: "ship-rates",
    category: "shipping",
    problem: "Shipping rates are wrong or missing at checkout",
    checks: [
      "Check the shipping zone covers the customer's country, state and PIN code.",
      "Confirm product weights are filled in when rates depend on weight.",
      "Free-shipping thresholds are compared against the cart subtotal after discounts.",
    ],
    reply:
      "Thanks for the details. Missing or wrong rates are usually down to the shipping zone not covering that address, or product weights being empty. Could you tell me the delivery address you tested with and one product name? I'll check your zones.",
  },
  {
    id: "ship-tracking",
    category: "shipping",
    problem: "Tracking number not updating for the customer",
    checks: [
      "Make sure the tracking number and carrier were saved on the order, not just in a note.",
      "Carriers can take up to 24 hours to show the first scan.",
      "Re-send the shipping email from the order page.",
    ],
    reply:
      "Carriers can take up to a day to show the first scan after a label is created. I'd suggest re-sending the shipping email from the order page so the customer gets the latest link. If it still shows nothing tomorrow, send me the order number and I'll dig in.",
  },
  {
    id: "ship-fulfil",
    category: "shipping",
    problem: "Order stuck in processing, can't mark as shipped",
    checks: [
      "The order must be paid before it can be fulfilled.",
      "Check that every line item has stock available.",
      "Try a hard refresh; if the button is still disabled, capture a screenshot.",
    ],
    reply:
      "An order can only be marked shipped once it is paid and every item has stock. Could you check both on that order? If they look fine, a screenshot of the order page would help me find what's blocking it.",
  },
  {
    id: "dom-connect",
    category: "domains",
    problem: "Custom domain won't connect",
    checks: [
      "Confirm the A record and CNAME match the values shown in Domain settings.",
      "Remove old records pointing to a previous host.",
      "DNS changes can take up to 48 hours; check propagation with a DNS lookup tool.",
    ],
    reply:
      "Thanks for setting this up. Please check that the A record and CNAME at your registrar exactly match the values on the Domain settings page, and that no older records point to another host. DNS can take up to 48 hours to spread. Send me the domain name and I'll check from our side too.",
  },
  {
    id: "dom-ssl",
    category: "domains",
    problem: "Browser shows 'Not secure' or SSL error",
    checks: [
      "SSL is issued automatically after DNS is correct; it can take up to an hour.",
      "A CAA record that blocks our certificate authority prevents issuing.",
      "Check the visitor is not loading an old http:// link.",
    ],
    reply:
      "The certificate is issued automatically once your DNS points to us, usually within an hour. If it has been longer, a CAA record at your registrar may be blocking it. Could you share your domain so I can check the certificate status?",
  },
  {
    id: "theme-edits",
    category: "themes",
    problem: "Theme changes aren't showing on the live store",
    checks: [
      "Confirm the edited theme is the published one, not a draft copy.",
      "Changes must be saved and published.",
      "Ask the customer to hard refresh or use a private window to bypass the cache.",
    ],
    reply:
      "That is usually either a saved-but-unpublished change or a cached page. Please check the edited theme is the one marked as live, press Save, and then view the store in a private window. Tell me what you see and I'll go from there.",
  },
  {
    id: "theme-broken",
    category: "themes",
    problem: "Layout broke after a theme update or custom code",
    checks: [
      "Ask what was changed last: theme update, new app, or pasted custom code.",
      "Revert to the previous theme version from the theme history.",
      "Look for custom CSS or scripts in the theme settings.",
    ],
    reply:
      "Sorry the layout broke. The quickest fix is to restore the previous version from your theme history, which undoes the last change. Could you tell me what was changed just before it broke? If custom code was added, I can help look through it.",
  },
  {
    id: "acct-login",
    category: "account",
    problem: "Can't log in or password reset email never arrives",
    checks: [
      "Check the email is correct and the account is not locked after repeated attempts.",
      "Reset emails can land in spam or promotions.",
      "If 2FA is lost, verify identity before resetting it.",
    ],
    reply:
      "Sorry you're locked out. Please check the spam and promotions folders for the reset email, and make sure you are using the email the store was created with. If it still doesn't arrive, tell me the email address and I'll help you get back in.",
  },
  {
    id: "acct-billing",
    category: "account",
    problem: "Billing question, plan change or unexpected charge",
    checks: [
      "Look up the plan and last invoice for the store.",
      "Confirm whether the charge is a renewal, an app, or a domain.",
      "Refund requests outside policy go to a lead.",
    ],
    reply:
      "Happy to look into this. Could you share the date and amount of the charge? I'll check which plan, app or domain it relates to and explain it, or put it right if it was a mistake.",
  },
  {
    id: "other-bug",
    category: "other",
    problem: "Something is broken and the customer can't say what",
    checks: [
      "Ask for steps, the page URL, a screenshot and the browser used.",
      "Try to reproduce it on the customer's store.",
      "Set priority to High if checkout or orders are affected.",
    ],
    reply:
      "Thanks for letting us know. To track this down, could you send the page address where it happens, what you clicked just before, and a screenshot if you can? That will help me reproduce it quickly.",
  },
  {
    id: "other-feature",
    category: "other",
    problem: "Customer is asking for a feature we don't have",
    checks: [
      "Check whether an existing setting or app already covers it.",
      "If not, log it as a request and tell the customer honestly.",
    ],
    reply:
      "Thanks for the suggestion, that's useful to hear. It isn't something we offer right now, but I've passed it on to the team. In the meantime, here's how you could get close to it: [describe workaround].",
  },
];
