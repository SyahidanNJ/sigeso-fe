import axios from 'axios';

export function newRequestId() {
  return `req-${Math.random().toString(36).slice(2, 10)}`;
}

// Bus notifikasi global: diisi ToastProvider. Setiap klik aksi (non-GET)
// otomatis memunculkan respons sukses/gagal + requestId.
export const pesanBus = { dorong: null };

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((c) => {
  c.headers['X-Request-ID'] = newRequestId();
  const t = localStorage.getItem('sigeso_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => {
    const m = (r.config.method || 'get').toLowerCase();
    if (m !== 'get' && !r.config.silent && pesanBus.dorong) pesanBus.dorong(r.data?.message || 'Berhasil.', 'ok');
    return r;
  },
  (e) => {
    const d = e.response?.data;
    if (d && d.status === false) {
      e.userMessage = d.message || 'Gagal.';
    } else {
      e.userMessage = 'Jaringan bermasalah, periksa internet lalu coba lagi.';
    }
    if (pesanBus.dorong) pesanBus.dorong(e.userMessage, 'gagal');
    return Promise.reject(e);
  }
);

export async function postClientError(err) {
  try {
    await api.post('/llm/client-errors', { message: String(err?.message || err) });
  } catch { /* abaikan */ }
}

// Unduh file auth (link biasa tak membawa token sehingga 401).
export async function unduhBerkas(path) {
  const r = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([r.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = path.split('/').pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default api;
