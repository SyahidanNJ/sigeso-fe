import axios from 'axios';

export function newRequestId() {
  return `req-${Math.random().toString(36).slice(2, 10)}`;
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((c) => {
  c.headers['X-Request-ID'] = newRequestId();
  const t = localStorage.getItem('sigeso_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    const d = e.response?.data;
    if (d && d.success === false) {
      e.userMessage = `${d.error?.message || 'Gagal'} (${d.error?.code || ''} · ${d.requestId || ''})`;
    }
    return Promise.reject(e);
  }
);

export async function postClientError(err) {
  try {
    await api.post('/llm/client-errors', { message: String(err?.message || err) });
  } catch { /* abaikan */ }
}

export default api;
