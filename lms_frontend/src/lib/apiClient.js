const baseUrl = process.env.REACT_APP_API_BASE || '';

/**
 * Lightweight API client placeholder for future backend calls.
 * It respects REACT_APP_API_BASE and adds basic helpers.
 */

// PUBLIC_INTERFACE
export async function apiGet(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(body),
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
}
