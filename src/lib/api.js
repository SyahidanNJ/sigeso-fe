import axios from 'axios';

export function newRequestId() {
  return `req-${Math.random().toString(36).slice(2, 10)}`;
}

// Bus notifikasi global: diisi ToastProvider. Setiap klik aksi (non-GET)
// otomatis memunculkan respons sukses/gagal + requestId.
export const pesanBus = { dorong: null };

// Pesan galat 5xx disembunyikan errorHandler jadi "Terjadi kesalahan server.",
// jadi kegagalan AI diterjemahkan dari kodenya (pola sama seperti halaman Sekolah).
const PESAN_KODE = {
  LLM_UNREADABLE: 'Gagal membaca foto jawaban. Isi nilainya manual.',
  LLM_INVALID_JSON: 'AI tidak mengembalikan jawaban yang bisa dibaca. Coba lagi.',
  LLM_TIMEOUT: 'Proses AI terlalu lama. Coba lagi.',
  LLM_ERROR: 'Layanan AI sedang bermasalah. Coba lagi nanti.',
  LLM_EMPTY: 'AI tidak menghasilkan soal yang bisa dipakai. Coba lagi.',
};

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
  async (e) => {
    // Unduhan (responseType blob) menyembunyikan pesan galat server di dalam
    // Blob; dibuka dulu supaya guru tak selalu melihat "jaringan bermasalah".
    if (e.response?.data instanceof Blob) {
      try { e.response.data = JSON.parse(await e.response.data.text()); } catch { /* biarkan */ }
    }
    const d = e.response?.data;
    if (d && d.status === false) {
      e.userMessage = PESAN_KODE[d.code] || d.message || 'Gagal.';
    } else {
      e.userMessage = 'Jaringan bermasalah, periksa internet lalu coba lagi.';
    }
    // Token kedaluwarsa/dicabut: buang sesi lalu kembali ke halaman masuk.
    // Hanya bila request tadi memang membawa token — login gagal tak ikut ke sini.
    if (e.response?.status === 401 && e.config?.headers?.Authorization) {
      localStorage.removeItem('sigeso_token');
      localStorage.removeItem('sigeso_user');
      if (location.pathname !== '/login') location.href = '/login';
      return Promise.reject(e);
    }
    // Pesan ganda dihindari: halaman yang punya tempat pesan sendiri (mis. form
    // masuk) memakai { silent: true }.
    if (!e.config?.silent && pesanBus.dorong) pesanBus.dorong(e.userMessage, 'gagal');
    return Promise.reject(e);
  }
);

export async function postClientError(err) {
  try {
    await api.post('/llm/client-errors', { message: String(err?.message || err) }, { silent: true });
  } catch { /* abaikan */ }
}

// Unduh file auth (link biasa tak membawa token sehingga 401).
// Path dari backend sudah berawalan /api/v1 → buang agar tak dobel dengan baseURL axios.
export async function unduhBerkas(path, nama) {
  const r = await api.get(path.replace(/^\/api\/v1/, ''), { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([r.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = nama || path.split('/').pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default api;
