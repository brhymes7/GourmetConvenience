/**
 * Clover expects money in cents, not dollars.
 * Example: $12.99 becomes 1299.
 */
export function formatCents(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format((Number(cents) || 0) / 100);
}

/**
 * Basis points are easier than floating point percentages.
 * 100 bps = 1%, 875 bps = 8.75%.
 */
export function calculateTaxCents(subtotalCents, taxRateBps) {
  return Math.round((subtotalCents * taxRateBps) / 10000);
}
