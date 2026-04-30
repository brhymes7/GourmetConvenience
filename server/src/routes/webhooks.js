import express from 'express';
import { createOrderEvent, getOrderByCheckoutSessionId, updateOrderStatus } from '../db.js';
import { verifyCloverWebhookSignature } from '../services/webhookSignature.js';

export const webhooksRouter = express.Router();

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

webhooksRouter.post('/clover', (req, res) => {
  if (!verifyCloverWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid Clover webhook signature.' });
  }

  const event = req.body || {};

  // Clover's Hosted Checkout webhook docs show these fields using TitleCase.
  // We also accept lowercase variants so your app survives small payload changes.
  const checkoutSessionId = pickFirst(event.Data, event.data, event.checkoutSessionId, event.checkout_session_id);
  const cloverPaymentId = pickFirst(event.Id, event.id, event.paymentId, event.payment_id);
  const status = String(pickFirst(event.Status, event.status, '')).toUpperCase();
  const type = String(pickFirst(event.Type, event.type, 'clover_webhook')).toLowerCase();

  const order = checkoutSessionId ? getOrderByCheckoutSessionId(checkoutSessionId) : null;

  createOrderEvent({
    orderId: order?.id,
    eventType: type,
    payload: event
  });

  if (order) {
    if (status === 'APPROVED') {
      updateOrderStatus(order.id, 'paid', { cloverPaymentId, cloverWebhookStatus: status });
    } else if (status === 'DECLINED') {
      updateOrderStatus(order.id, 'payment_failed', { cloverPaymentId, cloverWebhookStatus: status });
    } else {
      updateOrderStatus(order.id, 'payment_pending_review', { cloverPaymentId, cloverWebhookStatus: status });
    }
  }

  // Always respond quickly. Slow webhook responses cause retries.
  res.json({ received: true });
});
