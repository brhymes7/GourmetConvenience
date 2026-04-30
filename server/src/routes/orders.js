import express from 'express';
import { createOrder, attachCheckoutSession, getOrderById, listRecentOrders } from '../db.js';
import { assertPickupTimeIsAvailable } from '../services/availability.js';
import { createHostedCheckoutSession } from '../services/clover.js';
import { validateAddons } from '../services/customizations.js';
import { getMenuItemMap } from '../services/menu.js';
import { config } from '../config.js';
import { calculateTaxCents } from '../utils/money.js';
import { assertEmail, assertPositiveInteger, assertString } from '../utils/validation.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const ordersRouter = express.Router();

function normalizeCustomer(customer = {}) {
  const firstName = assertString(customer.firstName, 'First name', 80);
  const lastName = assertString(customer.lastName, 'Last name', 80);

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email: assertEmail(customer.email),
    phone: typeof customer.phone === 'string' ? customer.phone.trim().slice(0, 32) : ''
  };
}

async function buildValidatedItems(clientItems = []) {
  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    const error = new Error('Add at least one item to the cart.');
    error.statusCode = 400;
    throw error;
  }

  const menuMap = await getMenuItemMap();

  return clientItems.map((clientItem) => {
    const menuItemId = assertString(clientItem.menuItemId, 'Menu item ID', 120);
    const menuItem = menuMap.get(menuItemId);

    if (!menuItem) {
      const error = new Error(`Menu item not found: ${menuItemId}`);
      error.statusCode = 400;
      throw error;
    }

    const addons = validateAddons(menuItemId, clientItem.addonIds);
    const addonTotalCents = addons.reduce((sum, addon) => sum + addon.priceCents, 0);
    const noteParts = [];
    const note = typeof clientItem.note === 'string' ? clientItem.note.trim().slice(0, 240) : '';
    if (note) noteParts.push(note);
    if (addons.length) {
      noteParts.push(`Add-ons: ${addons.map((addon) => addon.label).join(', ')}`);
    }

    return {
      menuItemId,
      name: menuItem.name,
      priceCents: menuItem.priceCents + addonTotalCents,
      quantity: assertPositiveInteger(clientItem.quantity, 'Quantity'),
      note: noteParts.join(' | '),
      addons
    };
  });
}

ordersRouter.post('/create-checkout', async (req, res, next) => {
  try {
    const customer = normalizeCustomer(req.body.customer);
    const pickupTimeIso = await assertPickupTimeIsAvailable(req.body.pickupTimeIso);
    const orderComment = typeof req.body.orderComment === 'string' ? req.body.orderComment.trim().slice(0, 500) : '';
    const items = await buildValidatedItems(req.body.items);

    // Server calculates all pricing. Never trust browser-sent prices.
    const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const taxCents = calculateTaxCents(subtotalCents, config.defaultTaxRateBps);
    const totalCents = subtotalCents + taxCents;

    const order = createOrder({
      customer,
      pickupTimeIso,
      orderComment,
      items,
      subtotalCents,
      taxCents,
      totalCents
    });

    const checkout = await createHostedCheckoutSession({ order, customer, items });
    const updatedOrder = attachCheckoutSession(order.id, {
      checkoutSessionId: checkout.checkoutSessionId,
      checkoutUrl: checkout.checkoutUrl
    });

    res.status(201).json({
      orderId: updatedOrder.id,
      checkoutUrl: checkout.checkoutUrl,
      checkoutSessionId: checkout.checkoutSessionId
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/:orderId', async (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

ordersRouter.get('/', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 100);
  res.json({ orders: listRecentOrders(limit) });
});
