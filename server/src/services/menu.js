import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const menuPath = path.join(__dirname, '..', '..', 'data', 'menu.json');

/**
 * Menu storage starts as JSON to keep the project simple.
 * Later you can move menu items into SQLite or pull them from Clover inventory.
 */
export async function getMenuItems({ includeInactive = false } = {}) {
  const raw = await fs.readFile(menuPath, 'utf8');
  const menu = JSON.parse(raw);
  return includeInactive ? menu : menu.filter((item) => item.active);
}

export async function getMenuItemMap() {
  const menu = await getMenuItems();
  return new Map(menu.map((item) => [item.id, item]));
}

export async function saveMenuItems(menu) {
  if (!Array.isArray(menu)) {
    const error = new Error('Menu must be an array.');
    error.statusCode = 400;
    throw error;
  }

  const seenIds = new Set();
  const normalized = menu.map((item) => {
    if (!item || typeof item !== 'object') {
      const error = new Error('Each menu item must be an object.');
      error.statusCode = 400;
      throw error;
    }

    const id = String(item.id || '').trim();
    const name = String(item.name || '').trim();
    const category = String(item.category || '').trim();
    const priceCents = Number(item.priceCents);

    if (!id || !name || !category || !Number.isInteger(priceCents) || priceCents < 0) {
      const error = new Error('Each menu item needs id, name, category, and a non-negative priceCents value.');
      error.statusCode = 400;
      throw error;
    }

    if (seenIds.has(id)) {
      const error = new Error(`Duplicate menu item id: ${id}`);
      error.statusCode = 400;
      throw error;
    }
    seenIds.add(id);

    return {
      id,
      name,
      description: String(item.description || '').trim(),
      category,
      priceCents,
      active: Boolean(item.active),
      image: String(item.image || '').trim(),
      featured: Boolean(item.featured),
      popular: Boolean(item.popular)
    };
  });

  await fs.writeFile(menuPath, JSON.stringify(normalized, null, 2));
  return normalized;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeMenuItem(input = {}, existingId) {
  const name = String(input.name || '').trim();
  const category = String(input.category || '').trim();
  const priceCents = Number(input.priceCents);

  if (!name) {
    const error = new Error('Item name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!category) {
    const error = new Error('Category is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(priceCents) || priceCents < 0) {
    const error = new Error('Price must be a non-negative amount in cents.');
    error.statusCode = 400;
    throw error;
  }

  return {
    id: existingId || slugify(input.id || name) || randomUUID(),
    name,
    description: String(input.description || '').trim(),
    category,
    priceCents,
    active: input.active !== false,
    image: String(input.image || '').trim(),
    featured: Boolean(input.featured),
    popular: Boolean(input.popular)
  };
}

export async function getMenuCategories() {
  const menu = await getMenuItems({ includeInactive: true });
  return [...new Set(menu.map((item) => item.category).filter(Boolean))].sort();
}

export async function createMenuItem(input) {
  const menu = await getMenuItems({ includeInactive: true });
  const item = normalizeMenuItem(input);
  const ids = new Set(menu.map((menuItem) => menuItem.id));
  let finalId = item.id;
  if (ids.has(finalId)) {
    finalId = `${finalId}-${randomUUID().slice(0, 8)}`;
  }
  const updated = [...menu, { ...item, id: finalId }];
  await saveMenuItems(updated);
  return { item: { ...item, id: finalId }, menu: updated };
}

export async function updateMenuItem(id, input) {
  const menu = await getMenuItems({ includeInactive: true });
  const index = menu.findIndex((item) => item.id === id);
  if (index === -1) {
    const error = new Error('Menu item not found.');
    error.statusCode = 404;
    throw error;
  }

  const updatedItem = normalizeMenuItem({ ...menu[index], ...input }, id);
  const updated = menu.map((item) => (item.id === id ? updatedItem : item));
  await saveMenuItems(updated);
  return { item: updatedItem, menu: updated };
}

export async function deleteMenuItem(id) {
  const menu = await getMenuItems({ includeInactive: true });
  const exists = menu.some((item) => item.id === id);
  if (!exists) {
    const error = new Error('Menu item not found.');
    error.statusCode = 404;
    throw error;
  }

  const updated = menu.filter((item) => item.id !== id);
  await saveMenuItems(updated);
  return { menu: updated };
}
