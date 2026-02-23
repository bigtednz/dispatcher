const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dispatcher_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    api<{ accessToken: string; user: unknown }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => api<{ id: string; email: string; name: string; role: string }>('/auth/me'),
};

export const stations = {
  list: () => api<unknown[]>('/stations'),
  get: (id: string) => api<unknown>(`/stations/${id}`),
};

export const resources = {
  list: () => api<unknown[]>('/resources'),
  get: (id: string) => api<unknown>(`/resources/${id}`),
};

export const incidents = {
  list: (status?: string) =>
    api<unknown[]>(status ? `/incidents?status=${status}` : '/incidents'),
  get: (id: string) => api<unknown>(`/incidents/${id}`),
  create: (body: unknown) =>
    api<unknown>('/incidents', { method: 'POST', body: JSON.stringify(body) }),
  dispatch: (id: string, assignments: { resourceId: string; role?: string }[]) =>
    api<unknown>(`/incidents/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    }),
  close: (id: string) =>
    api<unknown>(`/incidents/${id}/close`, { method: 'POST' }),
  aar: (id: string) => api<unknown>(`/incidents/${id}/aar`),
};

export const simulation = {
  state: () => api<{ isRunning: boolean; startedAt: string | null; pausedAt: string | null }>('/simulation/state'),
  start: () => api<unknown>('/simulation/start', { method: 'POST' }),
  stop: () => api<unknown>('/simulation/stop', { method: 'POST' }),
  seedWaikato: () => api<unknown>('/simulation/seed-waikato', { method: 'POST' }),
};

export const events = {
  list: (incidentId?: string) =>
    api<unknown[]>(incidentId ? `/events?incidentId=${incidentId}` : '/events'),
};
