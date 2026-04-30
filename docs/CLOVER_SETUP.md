# Clover Setup

## Required Clover pieces

You need:

1. Clover developer account.
2. Sandbox test merchant.
3. Ecommerce / Hosted Checkout enabled.
4. Merchant ID.
5. Private Ecommerce API token or OAuth access token.
6. Webhook Signing Secret.
7. Optional Hosted Checkout `pageConfigUuid` if you create a custom Clover checkout page.

## Environment variables

Set these in `server/.env`:

```env
CLOVER_ENV=sandbox
CLOVER_MERCHANT_ID=your_merchant_id
CLOVER_PRIVATE_TOKEN=your_private_ecommerce_token_or_oauth_access_token
CLOVER_PAGE_CONFIG_UUID=
CLOVER_WEBHOOK_SIGNING_SECRET=your_webhook_signing_secret
```

## Sandbox vs production

The code chooses Clover's base URL based on `CLOVER_ENV`:

```js
sandbox:    https://apisandbox.dev.clover.com
production: https://api.clover.com
```

Do not switch to production until the entire flow works in sandbox.

## How checkout is created

File:

```txt
server/src/services/clover.js
```

The server builds a Clover payload like:

```json
{
  "customer": {
    "firstName": "Alex",
    "lastName": "Smith",
    "email": "alex@example.com"
  },
  "tips": { "enabled": true },
  "shoppingCart": {
    "lineItems": [
      {
        "name": "Signature Bowl",
        "price": 1299,
        "unitQty": 1,
        "note": "Pickup: 2026-04-29T12:00:00.000-04:00"
      }
    ]
  },
  "redirectUrls": {
    "success": "https://your-site.com/order/success?session_id={CHECKOUT_SESSION_ID}",
    "failure": "https://your-site.com/order/failure?error_code={ERROR_CODE}"
  }
}
```

## Webhook setup

Your webhook URL should be:

```txt
https://your-api-domain.com/api/webhooks/clover
```

For local testing, use a tunnel like ngrok:

```bash
ngrok http 5001
```

Then set the generated HTTPS URL in Clover's Hosted Checkout webhook settings.

## Webhook signature verification

File:

```txt
server/src/services/webhookSignature.js
```

The app verifies the `Clover-Signature` header using HMAC SHA-256. Do not skip this in production.

## Common Clover errors

### 401 Unauthorized

Usually means:

- Wrong token.
- Token is for the wrong merchant.
- Missing required permissions.
- Sandbox token used against production or production token used against sandbox.

### 404 or route not found

Usually means:

- Wrong base URL.
- Wrong endpoint.
- Clover feature not enabled for your merchant/app.

### Checkout created but webhook not updating order

Check:

- Webhook URL is HTTPS.
- Webhook secret matches `CLOVER_WEBHOOK_SIGNING_SECRET`.
- The server is reachable from the public internet.
- `checkoutSessionId` from Clover matches the stored local order.
