import { DateTime } from 'luxon';
import { getOrderSettings } from './settings.js';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function timeStringToMinutes(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  return hour * 60 + minute;
}

function minutesToTimeString(totalMinutes) {
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

/**
 * Returns pickup/order slots for a specific local date.
 * The store owner controls hours in server/data/order-settings.json.
 */
export async function getAvailableSlots(dateIso) {
  const settings = await getOrderSettings();
  const zone = settings.timezone || 'America/New_York';

  if (!settings.acceptOrders) {
    return { slots: [], reason: 'Ordering is currently turned off.' };
  }

  const requestedDay = DateTime.fromISO(dateIso, { zone }).startOf('day');
  if (!requestedDay.isValid) {
    const error = new Error('Invalid date. Use YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  const today = DateTime.now().setZone('America/New_York').startOf('day');

  if (requestedDay.toISODate() !== today.toISODate()) {
    return { slots: [], reason: 'Orders can only be placed for today.' };
  }

  if ((settings.blackoutDates || []).includes(requestedDay.toISODate())) {
    return { slots: [], reason: 'This date is unavailable.' };
  }

  const dayName = DAY_NAMES[requestedDay.weekday - 1];
  const windows = settings.hours?.[dayName] || [];
  const now = DateTime.now().setZone('America/New_York');
  const earliest = now.plus({ minutes: settings.leadTimeMinutes || 30 });
  const interval = settings.slotIntervalMinutes || 15;
  const slots = [];

  for (const window of windows) {
    const openMinutes = timeStringToMinutes(window.open);
    const closeMinutes = timeStringToMinutes(window.close);

    for (let cursor = openMinutes; cursor < closeMinutes; cursor += interval) {
      const time = minutesToTimeString(cursor);
  const slotDateTime = DateTime.fromISO(`${requestedDay.toISODate()}T${time}`, { zone: 'America/New_York' });

      // Prevent people from placing orders too close to pickup time.
      if (slotDateTime >= earliest) {
        slots.push({
          label: slotDateTime.toFormat('h:mm a'),
          value: slotDateTime.toISO()
        });
      }
    }
  }

  return { slots, timezone: zone };
}

/**
 * Route guard used before creating a checkout session.
 */
export async function assertPickupTimeIsAvailable(pickupTimeIso) {
  const settings = await getOrderSettings();
  const zone = 'America/New_York';
  const requested = DateTime.fromISO(pickupTimeIso, { zone });

  if (!requested.isValid) {
    const error = new Error('Invalid pickup time.');
    error.statusCode = 400;
    throw error;
  }

  const { slots, reason } = await getAvailableSlots(requested.toISODate());
  const exists = slots.some((slot) => DateTime.fromISO(slot.value).toMillis() === requested.toMillis());

  if (!exists) {
    const error = new Error(reason || 'That pickup time is not available anymore. Pick another time.');
    error.statusCode = 409;
    throw error;
  }

  return requested.toISO();
}
