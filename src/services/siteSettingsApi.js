/**
 * siteSettingsApi.js
 * Frontend HTTP client for Public & Admin Global Control API.
 * Uses relative paths /api/* to work seamlessly through the Vite proxy in dev
 * and directly with Express in production.
 */

export async function fetchPublicSiteSettings() {
  try {
    const res = await fetch('/api/site-settings', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[SITE SETTINGS] Could not load global settings from server. Using local fallback.', err.message);
    return null;
  }
}

export async function checkAdminSession() {
  try {
    const res = await fetch('/api/admin/session', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch {
    return { authenticated: false };
  }
}

export async function loginAdmin(password) {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Invalid credentials.');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export async function logoutAdmin() {
  try {
    const res = await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return await res.json();
  } catch {
    return { success: true };
  }
}

export async function fetchAdminSettings() {
  const res = await fetch('/api/admin/settings', {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to load admin settings (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function saveAdminSettings(payload) {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to persist global configuration.');
  }
  return data;
}
