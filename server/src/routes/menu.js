import express from 'express';
import { getMenuItems } from '../services/menu.js';

export const menuRouter = express.Router();

menuRouter.get('/', async (req, res, next) => {
  try {
    const menu = await getMenuItems();
    res.json({ menu });
  } catch (error) {
    next(error);
  }
});
