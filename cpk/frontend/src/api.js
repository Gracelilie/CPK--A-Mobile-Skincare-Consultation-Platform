const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let token = localStorage.getItem('cpk_token');

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}
const body = (method, data) => ({ method, body: JSON.stringify(data) });

export const api = {
  hasToken: () => !!token,
  logout: () => { token = null; localStorage.removeItem('cpk_token'); },
  async login(email, password) {
    const r = await req('/auth/login', body('POST', { email, password }));
    token = r.token; localStorage.setItem('cpk_token', token);
  },
  me: () => req('/me'),
  setProfileMode: (profile_mode) => req('/me', body('PATCH', { profile_mode })),
  aestheticians: () => req('/aestheticians'),
  appointments: () => req('/appointments'),
  book: (aesthetician_id, type) => req('/appointments', body('POST', { aesthetician_id, type })),
  messages: () => req('/messages'),
  sendMessage: (b) => req('/messages', body('POST', { body: b })),
  progress: () => req('/progress'),
  addProgress: (week, note) => req('/progress', body('POST', { week, note })),
};
