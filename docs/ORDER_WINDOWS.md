# Order Time Windows

The app controls when customers can place orders using:

```txt
server/data/order-settings.json
```

## Main settings

```json
{
  "acceptOrders": true,
  "timezone": "America/New_York",
  "leadTimeMinutes": 30,
  "slotIntervalMinutes": 15,
  "maxDaysAhead": 7,
  "blackoutDates": [],
  "hours": {}
}
```

## Setting definitions

### `acceptOrders`

Turns ordering on or off globally.

```json
"acceptOrders": false
```

Use this for emergencies, inventory issues, snow days, or temporary closures.

### `timezone`

Controls how the server reads business hours.

```json
"timezone": "America/New_York"
```

Do not rely on the customer's computer timezone.

### `leadTimeMinutes`

Minimum preparation time.

```json
"leadTimeMinutes": 30
```

If it is 12:00 PM, the earliest possible pickup slot is 12:30 PM.

### `slotIntervalMinutes`

Spacing between pickup times.

```json
"slotIntervalMinutes": 15
```

This creates slots like:

```txt
12:00 PM
12:15 PM
12:30 PM
12:45 PM
```

### `maxDaysAhead`

How far ahead customers can order.

```json
"maxDaysAhead": 7
```

### `blackoutDates`

Specific dates where ordering is blocked.

```json
"blackoutDates": ["2026-12-25", "2026-12-31"]
```

### `hours`

Business windows by weekday.

```json
"hours": {
  "friday": [
    { "open": "10:00", "close": "14:00" },
    { "open": "17:00", "close": "22:00" }
  ]
}
```

This supports split shifts, such as lunch and dinner.

## Where validation happens

File:

```txt
server/src/services/availability.js
```

Two functions matter:

- `getAvailableSlots(dateIso)` returns slots to the frontend.
- `assertPickupTimeIsAvailable(pickupTimeIso)` blocks checkout if the selected time is no longer valid.

## Why validate twice?

The customer might keep the page open for 30 minutes. A time slot that was valid when the page loaded may become invalid later. The backend rechecks availability right before creating the Clover checkout session.
