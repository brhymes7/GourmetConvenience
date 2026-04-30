# Architecture

## Goal

Build an ordering website that lets a customer place an order only during approved order windows, then pay through Clover.

## Why Hosted Checkout

Hosted Checkout is the safest starter path because your website does not collect or store card numbers. Your app creates a checkout session and redirects customers to Clover's hosted payment page.

## Components

### React storefront

Location: `client/src/main.jsx`

Responsibilities:

- Render the public-facing website.
- Fetch menu from the backend.
- Fetch available pickup time slots.
- Manage cart quantity and item notes.
- Send a checkout request to the backend.
- Redirect to Clover when the backend returns a checkout URL.

### Express API

Location: `server/src/index.js`

Responsibilities:

- Provide menu data to the frontend.
- Generate available time slots.
- Validate all checkout inputs.
- Calculate totals server-side.
- Create Clover Hosted Checkout sessions.
- Receive and verify Clover webhooks.
- Store order records in SQLite.

### SQLite database

Location after first run:

```txt
server/data/orders.sqlite
```

Tables:

- `orders`: main order record
- `order_items`: line items tied to each order
- `order_events`: webhook and internal event log

### Clover Hosted Checkout

The backend calls:

```txt
POST /invoicingcheckoutservice/v1/checkouts
```

The response returns a checkout URL. The customer pays on Clover. Clover then sends a webhook back to your backend.

## Data flow

```txt
Customer
  ↓
React storefront
  ↓ POST /api/orders/create-checkout
Express backend
  ↓ validates order time and cart
SQLite creates pending order
  ↓
Clover Hosted Checkout API
  ↓ returns checkout URL
Customer redirected to Clover
  ↓
Clover webhook POST /api/webhooks/clover
  ↓
Backend verifies signature and updates order status
```

## Why prices are calculated on the server

The frontend can be modified by anyone using browser dev tools. Never trust browser-submitted prices. The frontend sends only:

- Menu item ID
- Quantity
- Optional note

The backend looks up the real price from `server/data/menu.json`.

## Order states

| Status | Meaning |
|---|---|
| `pending_checkout` | Order was created locally, but payment is not confirmed. |
| `paid` | Clover webhook reported payment approval. |
| `payment_failed` | Clover webhook reported decline. |
| `payment_pending_review` | Webhook arrived, but status was not clearly approved/declined. |

## Future production architecture

For a client-ready version, consider:

- Admin dashboard for menu and hours.
- Email/SMS confirmations.
- Kitchen ticket printing.
- Clover inventory sync.
- Postgres once the app needs multi-location or higher volume.
