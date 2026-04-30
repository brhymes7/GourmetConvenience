# Clover Ordering Starter

A documented starter project for a modern online ordering website that:

- Shows a polished menu storefront.
- Lets customers choose pickup/order times only during allowed business windows.
- Creates a Clover Hosted Checkout session.
- Redirects customers to Clover to pay.
- Receives Clover webhooks and marks orders paid/failed in SQLite.
- Stores orders locally without a monthly database bill.

## Important payment note

When you say “payout to a Clover account,” the practical implementation is: **your website sends the customer to Clover Hosted Checkout, Clover processes the payment for the merchant, and Clover/merchant processing handles settlement to the merchant account.** Your app does not manually push payouts like Stripe Connect would. Your app creates the checkout and records the order.

## Stack

- Frontend: Vite + React
- Backend: Node.js + Express
- Storage: SQLite via `better-sqlite3`
- Dates/time windows: Luxon
- Payments: Clover Hosted Checkout
- Webhooks: Clover Hosted Checkout webhook endpoint

This stack was chosen because it is close to projects you have already worked on: React/Vite, Node/Express, environment variables, API routes, and checkout redirects.

## Folder structure

```txt
clover-ordering-starter/
  client/                  # React storefront
    src/
      api.js               # Browser API helper
      main.jsx             # Main UI and cart logic
      styles.css           # Modern visual design
  server/                  # Express API
    data/
      menu.json            # Starter menu data
      order-settings.json  # Business hours, lead time, blackout dates
    src/
      routes/              # API routes
      services/            # Clover, settings, menu, availability logic
      middleware/          # Error/admin middleware
      utils/               # Money and validation helpers
      db.js                # SQLite schema and query helpers
      index.js             # App entrypoint
  docs/                    # Project documentation
```

## Local setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Create your server env file

```bash
cp .env.example server/.env
```

Then edit `server/.env`:

```env
CLOVER_ENV=sandbox
CLOVER_MERCHANT_ID=your_test_merchant_id
CLOVER_PRIVATE_TOKEN=your_private_ecommerce_token
CLOVER_WEBHOOK_SIGNING_SECRET=your_webhook_secret
APP_BASE_URL=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run the app

```bash
npm run dev
```

- React: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:5001/api/health

## How the order flow works

1. Customer opens the storefront.
2. React fetches menu items from `GET /api/menu`.
3. React fetches available pickup slots from `GET /api/availability?date=YYYY-MM-DD`.
4. Customer adds items and submits the checkout form.
5. Server validates:
   - Customer name/email
   - Pickup time availability
   - Cart items against the server-side menu
   - Paid add-ons against the server-side add-on catalog
   - Price totals from server data only
6. Server creates a local SQLite order with status `pending_checkout`.
7. Server calls Clover Hosted Checkout and receives:
   - `href`
   - `checkoutSessionId`
8. Browser redirects to Clover using `href`.
9. Clover sends your webhook after payment.
10. Server verifies the Clover signature and updates the local order to `paid` or `payment_failed`.

## Admin page

Visit:

```txt
http://localhost:5173/admin
```

Use `ADMIN_API_KEY` from `server/.env`. The starter admin page can:

- View recent orders.
- Edit business hour settings JSON.
- Edit menu JSON.

## Editing business hours

Edit:

```txt
server/data/order-settings.json
```

Example:

```json
{
  "acceptOrders": true,
  "timezone": "America/New_York",
  "leadTimeMinutes": 30,
  "slotIntervalMinutes": 15,
  "maxDaysAhead": 7,
  "blackoutDates": ["2026-12-25"],
  "hours": {
    "monday": [{ "open": "10:00", "close": "20:00" }]
  }
}
```

## Editing menu items

Edit:

```txt
server/data/menu.json
```

Each item needs:

```json
{
  "id": "signature-bowl",
  "name": "Signature Bowl",
  "description": "Description here",
  "category": "Bowls",
  "priceCents": 1299,
  "active": true,
  "image": "https://example.com/image.jpg"
}
```

Prices must be stored in cents.

## Production direction

For production, deploy the frontend and backend together on a platform that supports:

- Environment variables
- HTTPS
- Persistent disk for SQLite
- Public webhook URLs

Good beginner-friendly choices:

- Render Web Service with persistent disk
- Railway with persistent volume/database
- A small VPS with PM2 + Nginx

Avoid deploying the backend to a serverless platform with no persistent disk unless you replace SQLite with Postgres.

## Documentation index

Read these next:

- `docs/ARCHITECTURE.md`
- `docs/CLOVER_SETUP.md`
- `docs/API.md`
- `docs/ORDER_WINDOWS.md`
- `docs/DEPLOYMENT.md`
- `docs/SECURITY_NOTES.md`
- `docs/TEST_PLAN.md`
- `docs/ROADMAP.md`
