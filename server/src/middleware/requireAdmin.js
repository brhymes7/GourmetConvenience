import { config } from '../config.js';

/**
 * Simple admin protection for editing hours/settings.
 * For a real client, upgrade this to login sessions or OAuth before launch.
 */
export function requireAdmin(req, res, next) {
  const providedKey = req.header('x-admin-api-key');

  if (!providedKey || providedKey !== config.adminApiKey) {
    return res.status(401).json({ error: 'Admin API key required.' });
  }

  next();
}
