import crypto from 'node:crypto';
import { config } from '../config.js';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function sign(payload) {
  return crypto
    .createHmac('sha256', config.adminTokenSecret)
    .update(payload)
    .digest('base64url');
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function verifyAdminPassword(password) {
  return safeEqual(password || '', config.adminPassword);
}

export function createAdminToken() {
  const now = Date.now();
  const payload = base64Url({ role: 'admin', iat: now, exp: now + TOKEN_TTL_MS });
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, receivedSignature] = token.split('.');
  const expectedSignature = sign(payload);
  if (!safeEqual(receivedSignature, expectedSignature)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.role === 'admin' && Number(decoded.exp) > Date.now();
  } catch {
    return false;
  }
}
