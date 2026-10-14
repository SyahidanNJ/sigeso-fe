import { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../components/Popup';
import Panduan from '../components/Panduan';

export default function Dashboard() {
  const dorong = useToast();
  const [loading, setLoading] = useState(false);
  async function cek() {
    setLoading(true);
    try {
      const h = await api.get('/health');
      const d = h.data.data;
      const t = await api.post('/llm/test', {}, { silent: true });
      dorong('Backend dan AI terhubung normal, siap dipakai.', 'ok');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ maxWidth: 640, margin: '40px auto' }}>
      <h1>Sigeso — Dashboard</h1>
      <Panduan id="dashboard" steps={['Tekan Cek backend + LLM untuk memastikan semuanya jalan.', 'Pilih menu di kiri untuk mulai bekerja.']} />
      <button onClick={cek} disabled={loading}>{loading ? 'Mengecek...' : 'Cek backend + LLM'}</button>
    </div>
  );
}
