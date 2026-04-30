# API Documentation

Base URL in development:

```txt
http://localhost:5001
```

## Health check

```http
GET /api/health
```

Response:

```json
{
  "ok": true,
  "environment": "development"
}
```

## Get menu

```http
GET /api/menu
```

Response:

```json
{
  "menu": [
    {
      "id": "signature-bowl",
      "name": "Signature Bowl",
      "description": "A premium house bowl...",
      "category": "Bowls",
      "priceCents": 1299,
      "active": true,
      "image": "https://..."
    }
  ]
}
```

## Get available pickup slots

```http
GET /api/availability?date=2026-04-29
```

Response:

```json
{
  "slots": [
    {
      "label": "12:00 PM",
      "value": "2026-04-29T12:00:00.000-04:00"
    }
  ],
  "timezone": "America/New_York"
}
```

If unavailable:

```json
{
  "slots": [],
  "reason": "This date is unavailable."
}
```

## Create checkout

```http
POST /api/orders/create-checkout
Content-Type: application/json
```

Request:

```json
{
  "customer": {
    "firstName": "Alex",
    "lastName": "Smith",
    "email": "alex@example.com",
    "phone": "5555551212"
  },
  "pickupTimeIso": "2026-04-29T12:00:00.000-04:00",
  "orderComment": "Please bag cold drinks separately.",
  "items": [
    {
      "menuItemId": "footlong-sub",
      "quantity": 2,
      "note": "Cheese: American | Meat: Turkey",
      "addonIds": ["extra-meat", "make-combo"]
    }
  ]
}
```

Response:

```json
{
  "orderId": "uuid",
  "checkoutUrl": "https://...",
  "checkoutSessionId": "uuid"
}
```

Important: the frontend does **not** submit prices. The backend recalculates prices from the server menu and the server-side add-on catalog.

## Get order by ID

```http
GET /api/orders/:orderId
```

Response:

```json
{
  "order": {
    "id": "uuid",
    "status": "paid",
    "customer_name": "Alex Smith",
    "customer_email": "alex@example.com",
    "pickup_time_iso": "2026-04-29T12:00:00.000-04:00",
    "subtotal_cents": 1299,
    "tax_cents": 0,
    "total_cents": 1299,
    "items": []
  }
}
```

## Admin login

```http
POST /api/admin/login
Content-Type: application/json
```

Request:

```json
{
  "password": "your_admin_password"
}
```

Response:

```json
{
  "token": "admin_session_token"
}
```

Use the returned token on admin requests:

```http
Authorization: Bearer admin_session_token
```

## Admin: list orders

```http
GET /api/admin/orders?limit=50
Authorization: Bearer admin_session_token
```

The storefront also includes a basic admin page at:

```txt
http://localhost:5173/admin
```

## Admin: get settings

```http
GET /api/admin/settings
Authorization: Bearer admin_session_token
```

## Admin: update settings

```http
PUT /api/admin/settings
Authorization: Bearer admin_session_token
Content-Type: application/json
```

Request body is the full settings JSON.

## Admin: get menu

```http
GET /api/admin/menu
Authorization: Bearer admin_session_token
```

## Admin: create menu item

```http
POST /api/admin/menu
Authorization: Bearer admin_session_token
Content-Type: application/json
```

## Admin: update menu item

```http
PUT /api/admin/menu/:id
Authorization: Bearer admin_session_token
Content-Type: application/json
```

## Admin: delete menu item

```http
DELETE /api/admin/menu/:id
Authorization: Bearer admin_session_token
```

## Admin: pickup windows

```http
GET /api/admin/pickup-windows
POST /api/admin/pickup-windows
PUT /api/admin/pickup-windows/:day/:index
DELETE /api/admin/pickup-windows/:day/:index
Authorization: Bearer admin_session_token
```

## Admin: store status

```http
GET /api/admin/store-status
PUT /api/admin/store-status
Authorization: Bearer admin_session_token
```

## Clover webhook

```http
POST /api/webhooks/clover
Clover-Signature: t=timestamp,v1=signature
```

The route verifies the signature, logs the event, finds the order by checkout session ID, and updates status.
