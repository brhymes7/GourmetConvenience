import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listRecentOrders } from '../db.js';
import { getMenuItems, saveMenuItems } from '../services/menu.js';
import { getOrderSettings, saveOrderSettings } from '../services/settings.js';

export const adminRouter = express.Router();

adminRouter.use(requireAdmin);

adminRouter.get('/settings', async (req, res, next) => {
  try {
    res.json({ settings: await getOrderSettings() });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/orders', (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 100);
  res.json({ orders: listRecentOrders(limit) });
});

adminRouter.get('/menu', async (req, res, next) => {
  try {
    res.json({ menu: await getMenuItems({ includeInactive: true }) });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/menu', async (req, res, next) => {
  try {
    const updated = await saveMenuItems(req.body.menu);
    res.json({ menu: updated });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/settings', async (req, res, next) => {
  try {
    // Keep this intentionally flexible for the starter.
    // Add stricter validation before giving this to staff or clients.
    const updated = await saveOrderSettings(req.body);
    res.json({ settings: updated });
  } catch (error) {
    next(error);
  }
});
