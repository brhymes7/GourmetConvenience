import crypto from 'node:crypto';
import { config } from '../config.js';

function parseCloverSignature(headerValue) {
  if (!headerValue) return null;

  return headerValue.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});
}

/**
 * Clover Hosted Checkout webhook verification.
 * Expected header example: Clover-Signature: t=1642599079,v1=<hmac>
 * The signed payload is: `${timestamp}.${rawBody}`.
 */
export function verifyCloverWebhookSignature(req) {
  const secret = config.clover.webhookSigningSecret;

  // During early local dev, you may not have a webhook secret yet.
  // Keep this warning loud so nobody accidentally leaves production unsecured.
  if (!secret) {
    console.warn('[webhook] CLOVER_WEBHOOK_SIGNING_SECRET is not set. Skipping signature verification.');
    return config.nodeEnv !== 'production';
  }

  const parsed = parseCloverSignature(req.header('Clover-Signature'));
  if (!parsed?.t || !parsed?.v1 || !req.rawBody) return false;

  const signedPayload = `${parsed.t}.${req.rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const received = parsed.v1;

  // timingSafeEqual prevents tiny timing leaks in string comparisons.
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
