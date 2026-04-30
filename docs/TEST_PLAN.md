# Test Plan

## Local smoke test

1. Install dependencies:

```bash
npm run install:all
```

2. Copy env:

```bash
cp .env.example server/.env
```

3. Start app:

```bash
npm run dev
```

4. Visit:

```txt
http://localhost:5173
```

5. API health check:

```txt
http://localhost:5001/api/health
```

Expected:

```json
{ "ok": true }
```

## Menu test

```bash
curl http://localhost:5001/api/menu
```

Expected:

- JSON response.
- At least one active menu item.
- Prices are in cents.

## Availability test

```bash
curl "http://localhost:5001/api/availability?date=2026-04-29"
```

Expected:

- Slots are returned if the date is open.
- Empty slots with a reason if closed/unavailable.

## Checkout validation tests

### Empty cart

Send an empty cart to `/api/orders/create-checkout`.

Expected: `400` error.

### Invalid email

Expected: `400` error.

### Invalid pickup time

Expected: `409` error.

### Tampered price

Frontend cannot submit price. The backend ignores any price-like fields and calculates from menu data.

## Clover sandbox test

1. Add real sandbox Clover credentials to `server/.env`.
2. Place an order from the React site.
3. Confirm the backend returns `checkoutUrl`.
4. Confirm browser redirects to Clover.
5. Complete sandbox payment.
6. Confirm Clover sends webhook.
7. Confirm local DB order status changes to `paid`.

## Webhook local test without Clover

In local development only, if `CLOVER_WEBHOOK_SIGNING_SECRET` is empty, unsigned webhooks are accepted.

After creating an order and checkout session, send:

```bash
curl -X POST http://localhost:5001/api/webhooks/clover \
  -H "Content-Type: application/json" \
  -d '{
    "CreatedTime": "2026-04-29T12:00:00Z",
    "Message": "Approved for 1299",
    "Status": "APPROVED",
    "Type": "PAYMENT",
    "Id": "payment_test_123",
    "MerchantId": "merchant_test_123",
    "Data": "replace-with-checkout-session-id"
  }'
```

Expected:

```json
{ "received": true }
```

Then check the order:

```bash
curl http://localhost:5001/api/orders/replace-with-order-id
```

Expected status:

```txt
paid
```
