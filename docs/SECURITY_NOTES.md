# Security Notes

## Keep Clover secrets server-side

Never expose these in React:

- `CLOVER_PRIVATE_TOKEN`
- `CLOVER_WEBHOOK_SIGNING_SECRET`
- `ADMIN_API_KEY`

React code is public once deployed. Anything in the browser can be inspected.

## Do not collect card data

This starter redirects customers to Clover Hosted Checkout. That means your app avoids collecting raw card numbers. Keep it that way unless you are ready for deeper PCI compliance responsibilities.

## Validate webhook signatures

The webhook route checks `Clover-Signature` using HMAC SHA-256.

File:

```txt
server/src/services/webhookSignature.js
```

In development, the app allows unsigned webhooks only if no signing secret is configured and `NODE_ENV` is not production. In production, set `CLOVER_WEBHOOK_SIGNING_SECRET`.

## Server-side pricing only

Never trust prices from the frontend. This app only accepts menu item IDs and quantities from the browser. Prices come from `server/data/menu.json`.

## Admin endpoint warning

The starter uses a simple `x-admin-api-key` header. Good enough for local development, not enough for a real staff dashboard.

Before production, upgrade admin access to:

- Login sessions
- Auth provider
- Role-based access
- Audit logs

## HTTPS required

Use HTTPS in production for:

- Clover redirect URLs
- Clover webhook URL
- Customer checkout requests

## Rate limiting

Add rate limiting before launch to reduce abuse:

- `express-rate-limit`
- Cloudflare WAF
- Nginx rate limits

Suggested protected endpoints:

- `POST /api/orders/create-checkout`
- `POST /api/webhooks/clover`
- Admin endpoints

## Data privacy

The SQLite DB stores customer names, emails, phone numbers, order details, and pickup times. Treat it like sensitive business/customer data.

Minimum best practices:

- Back up the DB securely.
- Restrict server access.
- Do not email DB backups casually.
- Delete old records if they are no longer needed.
