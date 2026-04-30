# Code Walkthrough

## `server/src/index.js`

This is the backend entry point. It:

- Starts Express.
- Enables security headers with Helmet.
- Enables CORS for the React app.
- Saves raw request bodies for webhook signature verification.
- Registers all API routes.
- Starts the server.

## `server/src/db.js`

This file owns SQLite.

Key functions:

- `migrate()` creates tables.
- `createOrder()` inserts order and line items.
- `attachCheckoutSession()` saves Clover session info.
- `updateOrderStatus()` changes order status after webhook.
- `getOrderByCheckoutSessionId()` connects a Clover webhook to a local order.

## `server/src/services/availability.js`

This file turns business hours into available pickup slots.

Key functions:

- `getAvailableSlots(dateIso)` returns slots for the UI.
- `assertPickupTimeIsAvailable(pickupTimeIso)` protects checkout from invalid times.

## `server/src/services/clover.js`

This file is the Clover integration layer.

It creates the Hosted Checkout payload, sends it to Clover, and returns:

- `checkoutUrl`
- `checkoutSessionId`

## `server/src/routes/orders.js`

This file is the most important business route.

The route `POST /api/orders/create-checkout`:

1. Validates customer info.
2. Validates pickup time.
3. Validates cart items against server menu.
4. Calculates subtotal/tax/total.
5. Creates pending local order.
6. Creates Clover checkout.
7. Saves checkout session ID.
8. Returns checkout URL to React.

## `server/src/routes/webhooks.js`

This receives Clover events.

When payment is approved:

```txt
pending_checkout → paid
```

When payment is declined:

```txt
pending_checkout → payment_failed
```

## `client/src/main.jsx`

This is the public storefront.

It handles:

- Menu rendering.
- Cart state.
- Customer form.
- Pickup date/time selection.
- Checkout submission.
- Redirecting the customer to Clover.

## `client/src/styles.css`

Modern styling without Tailwind dependency.

Why plain CSS?

- Faster setup.
- Easier to deploy.
- Easier for a client to understand.
- No extra Tailwind configuration to debug.
