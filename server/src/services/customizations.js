export const ADDON_OPTIONS = [
  { id: 'extra-meat', label: 'Extra Meat', priceCents: 199 },
  { id: 'hot-honey', label: 'Hot Honey', priceCents: 99 },
  { id: 'add-bacon', label: 'Add Bacon', priceCents: 199 },
  { id: 'make-combo', label: 'Make It a Combo', priceCents: 199 }
];

export const BUILD_YOUR_OWN_ITEM_IDS = new Set([
  'footlong-sub',
  '6inch-sub',
  '6inch-ciabatta',
  'bagel'
]);

const addonMap = new Map(ADDON_OPTIONS.map((addon) => [addon.id, addon]));

export function validateAddons(menuItemId, addonIds = []) {
  if (!Array.isArray(addonIds)) {
    const error = new Error('Add-ons must be an array.');
    error.statusCode = 400;
    throw error;
  }

  if (!BUILD_YOUR_OWN_ITEM_IDS.has(menuItemId) && addonIds.length > 0) {
    const error = new Error('Add-ons are only available for build-your-own items.');
    error.statusCode = 400;
    throw error;
  }

  const uniqueIds = [...new Set(addonIds)];
  return uniqueIds.map((id) => {
    const addon = addonMap.get(id);
    if (!addon) {
      const error = new Error(`Add-on not found: ${id}`);
      error.statusCode = 400;
      throw error;
    }
    return addon;
  });
}
