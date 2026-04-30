import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized config keeps environment variables out of random files.
 * This makes deployment less messy and prevents secrets from leaking into the client.
 */
const required = ['CLOVER_MERCHANT_ID', 'CLOVER_PRIVATE_TOKEN'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Missing ${key}. Clover checkout calls will fail until it is set.`);
  }
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5001),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminApiKey: process.env.ADMIN_API_KEY || 'change-this-before-production',
  adminPassword: process.env.ADMIN_PASSWORD || process.env.ADMIN_API_KEY || 'change-this-before-production',
  adminTokenSecret: process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_API_KEY || 'change-this-before-production',
  defaultTaxRateBps: Number(process.env.DEFAULT_TAX_RATE_BPS || 0),

  clover: {
    env: process.env.CLOVER_ENV || 'sandbox',
    merchantId: process.env.CLOVER_MERCHANT_ID || '',
    privateToken: process.env.CLOVER_PRIVATE_TOKEN || '',
    pageConfigUuid: process.env.CLOVER_PAGE_CONFIG_UUID || '',
    webhookSigningSecret: process.env.CLOVER_WEBHOOK_SIGNING_SECRET || ''
  }
};

export function getCloverBaseUrl() {
  // Clover uses different API hosts for sandbox vs live processing.
  // Keep this server-side only. The browser should never know your private token.
  return config.clover.env === 'production'
    ? 'https://api.clover.com'
    : 'https://apisandbox.dev.clover.com';
}
