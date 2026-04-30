import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
      image: String(item.image || '').trim()
    };
  });

  await fs.writeFile(menuPath, JSON.stringify(normalized, null, 2));
  return normalized;
}
