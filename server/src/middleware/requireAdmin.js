import { config } from '../config.js';
import { verifyAdminToken } from '../services/adminAuth.js';

/**
 * Simple admin protection for editing hours/settings.
 * For a real client, upgrade this to login sessions or OAuth before launch.
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.header('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (verifyAdminToken(bearerToken)) {
    return next();
  }

  const providedKey = req.header('x-admin-api-key');

  if (!providedKey || providedKey !== config.adminApiKey) {
    return res.status(401).json({ error: 'Admin login required.' });
  }

  next();
}
