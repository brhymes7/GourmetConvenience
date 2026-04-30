import express from 'express';
import { getAvailableSlots } from '../services/availability.js';

export const availabilityRouter = express.Router();

availabilityRouter.get('/', async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required. Use YYYY-MM-DD.' });
    }

    const result = await getAvailableSlots(date);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
