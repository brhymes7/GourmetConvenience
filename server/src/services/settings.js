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
