// Vite reads VITE_* variables from client/.env.
// In development, the server runs on port 5001.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

export function fetchMenu() {
  return request('/api/menu');
}

export function fetchAvailability(dateIso) {
  return request(`/api/availability?date=${encodeURIComponent(dateIso)}`);
}

export function createCheckout(payload) {
  return request('/api/orders/create-checkout', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

function adminHeaders(apiKey) {
  return { 'x-admin-api-key': apiKey };
}

export function fetchAdminOrders(apiKey) {
  return request('/api/admin/orders', { headers: adminHeaders(apiKey) });
}

export function fetchAdminSettings(apiKey) {
  return request('/api/admin/settings', { headers: adminHeaders(apiKey) });
}

export function saveAdminSettings(apiKey, settings) {
  return request('/api/admin/settings', {
    method: 'PUT',
    headers: adminHeaders(apiKey),
    body: JSON.stringify(settings)
  });
}

export function fetchAdminMenu(apiKey) {
  return request('/api/admin/menu', { headers: adminHeaders(apiKey) });
}

export function saveAdminMenu(apiKey, menu) {
  return request('/api/admin/menu', {
    method: 'PUT',
    headers: adminHeaders(apiKey),
    body: JSON.stringify({ menu })
  });
}
