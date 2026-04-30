import rateLimit from 'express-rate-limit';

function jsonHandler(req, res) {
  res.status(429).json({
    error: 'Too many requests. Please wait a moment and try again.',
    statusCode: 429
  });
}

/**
 * Strict — checkout endpoint only.
 * 10 attempts per IP per 15 minutes prevents checkout spam and Clover API abuse.
 */
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

/**
 * Moderate — general API routes (availability, orders lookup).
 * 100 requests per IP per 15 minutes is plenty for normal use.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

/**
 * Loose — public read-only routes (menu, health).
 * 300 requests per IP per 15 minutes — generous for page loads and refreshes.
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});
