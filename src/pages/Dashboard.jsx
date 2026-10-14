import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../components/Popup';
import Panduan from '../components/Panduan';

export default function Dashboard() {
  const dorong = useToast();
  const [loading, setLoading] = useState(false);
  const [stat, setStat] = useState({ ujian: '-', soal: '-' });
  useEffect(() => {
    if (!localStorage.getItem('sigeso_token')) return;
    Promise.allSettled([api.get('/exams'), api.get('/questions')]).then(([u, q]) => {
      setStat({
        ujian: u.status === 'fulfilled' ? u.value.data.data.length : '-',
        soal: q.status === 'fulfilled' ? q.value.data.data.length : '-',
      });
    });
  }, []);
  async function cek() {
    setLoading(true);
    try {
      await api.get('/health');
      await api.post('/llm/test', {}, { silent: true });
      dorong('Backend dan AI terhubung normal, siap dipakai.', 'ok');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <div className="kepala"><h2>Dashboard</h2><span className="sub">Ringkasan Sigeso</span></div>
      <div className="angka">
        <div className="stat"><b>{stat.ujian}</b><span>Ujian</span></div>
        <div className="stat"><b>{stat.soal}</b><span>Soal di bank</span></div>
      </div>
      <Panduan id="dashboard" steps={['Tekan Cek backend + LLM untuk memastikan semuanya jalan.', 'Pilih menu di kiri untuk mulai bekerja.']} />
      <div className="kartu">
        <button onClick={cek} disabled={loading}>{loading ? 'Mengecek...' : 'Cek backend + LLM'}</button>
      </div>
      <p><a href="/login">Login</a></p>
    </div>
  );
}
