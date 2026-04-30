import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listRecentOrders } from '../db.js';
import { createAdminToken, verifyAdminPassword } from '../services/adminAuth.js';
import { createMenuItem, deleteMenuItem, getMenuCategories, getMenuItems, saveMenuItems, updateMenuItem } from '../services/menu.js';
import {
  createPickupWindow,
  deletePickupWindow,
  getOrderSettings,
  getPickupWindows,
  getStoreStatus,
  saveOrderSettings,
  updatePickupWindow,
  updateStoreStatus
} from '../services/settings.js';

export const adminRouter = express.Router();

adminRouter.post('/login', (req, res) => {
  if (!verifyAdminPassword(req.body?.password)) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }

  res.json({ token: createAdminToken() });
});

adminRouter.use(requireAdmin);

adminRouter.get('/me', (req, res) => {
  res.json({ authenticated: true });
});

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
    res.json({
      menu: await getMenuItems({ includeInactive: true }),
      categories: await getMenuCategories()
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/menu', async (req, res, next) => {
  try {
    const result = await createMenuItem(req.body);
    res.status(201).json(result);
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

adminRouter.put('/menu/:id', async (req, res, next) => {
  try {
    res.json(await updateMenuItem(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/menu/:id', async (req, res, next) => {
  try {
    res.json(await deleteMenuItem(req.params.id));
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

adminRouter.get('/pickup-windows', async (req, res, next) => {
  try {
    res.json({ pickupWindows: await getPickupWindows() });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/pickup-windows', async (req, res, next) => {
  try {
    const result = await createPickupWindow(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/pickup-windows/:day/:index', async (req, res, next) => {
  try {
    res.json(await updatePickupWindow(req.params.day, req.params.index, req.body));
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/pickup-windows/:day/:index', async (req, res, next) => {
  try {
    res.json(await deletePickupWindow(req.params.day, req.params.index));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/store-status', async (req, res, next) => {
  try {
    res.json({ storeStatus: await getStoreStatus() });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/store-status', async (req, res, next) => {
  try {
    res.json(await updateStoreStatus(req.body));
  } catch (error) {
    next(error);
  }
});
