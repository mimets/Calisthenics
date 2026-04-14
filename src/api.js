async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || 'Richiesta non riuscita');
  }

  return payload;
}

export function getSession() {
  return request('/api/session');
}

export function loginRequest(username, password) {
  return request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logoutRequest() {
  return request('/api/logout', {
    method: 'POST',
  });
}

export function getGyms() {
  return request('/api/gyms');
}

export function createGym(name) {
  return request('/api/gyms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateGym(gymId, name) {
  return request(`/api/gyms/${gymId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function deleteGym(gymId) {
  return request(`/api/gyms/${gymId}`, {
    method: 'DELETE',
  });
}

export function createClient(gymId, payload) {
  return request(`/api/gyms/${gymId}/clients`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateClient(clientId, payload) {
  return request(`/api/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteClient(clientId) {
  return request(`/api/clients/${clientId}`, {
    method: 'DELETE',
  });
}
