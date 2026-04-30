import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, '..', '..', 'data', 'order-settings.json');

export async function getOrderSettings() {
  const raw = await fs.readFile(settingsPath, 'utf8');
  return JSON.parse(raw);
}

export async function saveOrderSettings(settings) {
  // Pretty-print JSON so the owner can edit it by hand if needed.
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  return settings;
}

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function assertDay(day) {
  const normalized = String(day || '').toLowerCase();
  if (!DAY_NAMES.includes(normalized)) {
    const error = new Error('Day must be a valid weekday.');
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

function assertTime(value, fieldName) {
  const time = String(value || '').trim();
  if (!/^\d{2}:\d{2}$/.test(time)) {
    const error = new Error(`${fieldName} must use HH:MM format.`);
    error.statusCode = 400;
    throw error;
  }
  const [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || minute > 59) {
    const error = new Error(`${fieldName} must be a valid time.`);
    error.statusCode = 400;
    throw error;
  }
  return time;
}

function normalizeWindow(input = {}) {
  const open = assertTime(input.open, 'Open time');
  const close = assertTime(input.close, 'Close time');
  if (open >= close) {
    const error = new Error('Close time must be after open time.');
    error.statusCode = 400;
    throw error;
  }

  let maxOrders = null;
  if (input.maxOrders !== '' && input.maxOrders !== undefined && input.maxOrders !== null) {
    maxOrders = Number(input.maxOrders);
    if (!Number.isInteger(maxOrders) || maxOrders < 0) {
      const error = new Error('Max orders must be a non-negative whole number.');
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    open,
    close,
    active: input.active !== false,
    maxOrders
  };
}

export async function getPickupWindows() {
  const settings = await getOrderSettings();
  return DAY_NAMES.flatMap((day) => (settings.hours?.[day] || []).map((window, index) => ({
    id: `${day}:${index}`,
    day,
    index,
    open: window.open,
    close: window.close,
    active: window.active !== false,
    maxOrders: window.maxOrders ?? null
  })));
}

export async function createPickupWindow(input) {
  const settings = await getOrderSettings();
  const day = assertDay(input.day);
  const window = normalizeWindow(input);
  const hours = { ...(settings.hours || {}) };
  hours[day] = [...(hours[day] || []), window];
  const updated = await saveOrderSettings({ ...settings, hours });
  return { settings: updated, pickupWindows: await getPickupWindows() };
}

export async function updatePickupWindow(dayInput, indexInput, input) {
  const settings = await getOrderSettings();
  const day = assertDay(dayInput);
  const index = Number(indexInput);
  const dayWindows = [...(settings.hours?.[day] || [])];
  if (!Number.isInteger(index) || index < 0 || !dayWindows[index]) {
    const error = new Error('Pickup window not found.');
    error.statusCode = 404;
    throw error;
  }

  dayWindows[index] = normalizeWindow({ ...dayWindows[index], ...input });
  const updated = await saveOrderSettings({
    ...settings,
    hours: { ...(settings.hours || {}), [day]: dayWindows }
  });
  return { settings: updated, pickupWindows: await getPickupWindows() };
}

export async function deletePickupWindow(dayInput, indexInput) {
  const settings = await getOrderSettings();
  const day = assertDay(dayInput);
  const index = Number(indexInput);
  const dayWindows = [...(settings.hours?.[day] || [])];
  if (!Number.isInteger(index) || index < 0 || !dayWindows[index]) {
    const error = new Error('Pickup window not found.');
    error.statusCode = 404;
    throw error;
  }

  dayWindows.splice(index, 1);
  const updated = await saveOrderSettings({
    ...settings,
    hours: { ...(settings.hours || {}), [day]: dayWindows }
  });
  return { settings: updated, pickupWindows: await getPickupWindows() };
}

export async function getStoreStatus() {
  const settings = await getOrderSettings();
  return {
    acceptOrders: settings.acceptOrders !== false,
    closedMessage: settings.closedMessage || '',
    cutoffMessage: settings.cutoffMessage || '',
    timezone: settings.timezone || 'America/New_York',
    leadTimeMinutes: settings.leadTimeMinutes || 15,
    slotIntervalMinutes: settings.slotIntervalMinutes || 15
  };
}

export async function updateStoreStatus(input = {}) {
  const settings = await getOrderSettings();
  const leadTimeMinutes = Number(input.leadTimeMinutes || settings.leadTimeMinutes || 15);
  const slotIntervalMinutes = Number(input.slotIntervalMinutes || settings.slotIntervalMinutes || 15);
  if (!Number.isFinite(leadTimeMinutes) || leadTimeMinutes < 0 || !Number.isFinite(slotIntervalMinutes) || slotIntervalMinutes < 1) {
    const error = new Error('Lead time and slot interval must be valid numbers.');
    error.statusCode = 400;
    throw error;
  }

  const updated = await saveOrderSettings({
    ...settings,
    acceptOrders: Boolean(input.acceptOrders),
    closedMessage: String(input.closedMessage || '').trim().slice(0, 180),
    cutoffMessage: String(input.cutoffMessage || '').trim().slice(0, 180),
    timezone: String(input.timezone || settings.timezone || 'America/New_York').trim(),
    leadTimeMinutes,
    slotIntervalMinutes
  });
  return { settings: updated, storeStatus: await getStoreStatus() };
}
