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

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

export function fetchAdminOrders(token) {
  return request('/api/admin/orders', { headers: adminHeaders(token) });
}

export function fetchAdminSettings(token) {
  return request('/api/admin/settings', { headers: adminHeaders(token) });
}

export function saveAdminSettings(token, settings) {
  return request('/api/admin/settings', {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(settings)
  });
}

export function fetchAdminMenu(token) {
  return request('/api/admin/menu', { headers: adminHeaders(token) });
}

export function saveAdminMenu(token, menu) {
  return request('/api/admin/menu', {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify({ menu })
  });
}

export function createAdminMenuItem(token, item) {
  return request('/api/admin/menu', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(item)
  });
}

export function updateAdminMenuItem(token, id, item) {
  return request(`/api/admin/menu/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(item)
  });
}

export function deleteAdminMenuItem(token, id) {
  return request(`/api/admin/menu/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(token)
  });
}

export function fetchAdminPickupWindows(token) {
  return request('/api/admin/pickup-windows', { headers: adminHeaders(token) });
}

export function createAdminPickupWindow(token, window) {
  return request('/api/admin/pickup-windows', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(window)
  });
}

export function updateAdminPickupWindow(token, day, index, window) {
  return request(`/api/admin/pickup-windows/${encodeURIComponent(day)}/${encodeURIComponent(index)}`, {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(window)
  });
}

export function deleteAdminPickupWindow(token, day, index) {
  return request(`/api/admin/pickup-windows/${encodeURIComponent(day)}/${encodeURIComponent(index)}`, {
    method: 'DELETE',
    headers: adminHeaders(token)
  });
}

export function fetchAdminStoreStatus(token) {
  return request('/api/admin/store-status', { headers: adminHeaders(token) });
}

export function updateAdminStoreStatus(token, status) {
  return request('/api/admin/store-status', {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(status)
  });
}
