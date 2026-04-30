# Roadmap

## Version 1: Starter MVP

Already included:

- Public storefront.
- Cart.
- Customer info form.
- Pickup time slots.
- Clover Hosted Checkout session creation.
- SQLite order storage.
- Clover webhook handler.
- Admin-protected settings endpoint.
- Basic `/admin` operations page for recent orders, business hours, and menu JSON.
- Clover success/failure landing pages.
- Order-level comments.
- Server-validated paid add-ons.
- Orderable convenience items.

## Version 2: Client-ready MVP

Add:

- Admin login.
- Staff-friendly admin login.
- Polished admin dashboard for orders.
- Polished admin dashboard for business hours.
- Form-based admin dashboard for menu editing.
- Email confirmation after paid webhook.
- SMS confirmation with Twilio.
- Branded success/failure pages with order lookup details.
- Order cancellation flow.
- Rate limiting.
- Production logging.

## Version 3: Strong restaurant workflow

Add:

- Kitchen display screen.
- Print tickets.
- Pickup status: `received`, `preparing`, `ready`, `completed`.
- Staff notes.
- Prep time controls by item/category.
- Daily order capacity limits.
- Automatic item sold-out toggle.

## Version 4: Multi-client SaaS direction

If you want to sell this to multiple businesses:

- Multi-tenant database model.
- Merchant onboarding.
- OAuth per merchant.
- Each merchant has own Clover token.
- Per-merchant settings and menu.
- Billing/subscription system.
- Audit logs.
- Support dashboard.

## What I would build first for a paying client

For your first paid implementation, build:

1. Storefront.
2. Clover Hosted Checkout.
3. Pickup windows.
4. Admin order list.
5. Email confirmation.
6. Manual menu JSON editing at first.

Do not overbuild SaaS features before one business is actually using it.
