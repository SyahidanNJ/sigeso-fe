import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Cetak() {
  const [ujian, setUjian] = useState([]);
  const [aktif, setAktif] = useState('');
  const [hasil, setHasil] = useState('');
  const [lembar, setLembar] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/exams').then((r) => { setUjian(r.data.data); if (r.data.data[0]) setAktif(r.data.data[0].id); }).catch((e) => setMsg(e.userMessage || e.message));
  }, []);
  async function muatLembar(id) {
    const r = await api.get(`/exams/${id}/sheets`);
    setLembar(r.data.data);
  }
  useEffect(() => { if (aktif) muatLembar(aktif).catch((e) => setMsg(e.userMessage || e.message)); }, [aktif]);

  async function cetak() {
    setLoading(true);
    try {
      const r = await api.post(`/exams/${aktif}/print`, {});
      setHasil(r.data.data.download);
      setMsg(r.data.message);
      muatLembar(aktif);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }
  async function cetakUlang(id) {
    setLoading(true);
    try {
      const r = await api.post(`/sheets/${id}/reprint`, {});
      setHasil(r.data.data.download);
      setMsg(r.data.message);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }

  return (
    <div className="kartu">
      <h2>Cetak lembar (satu-lembar ber-QR)</h2>
      {msg && <p className="pesan gagal">{msg}</p>}
      <div className="baris">
        <select value={aktif} onChange={(e) => setAktif(e.target.value)}>
          {ujian.map((u) => <option key={u.id} value={u.id}>{u.title} ({u.n_soal} soal)</option>)}
        </select>
        <button onClick={cetak} disabled={loading || !aktif}>{loading ? 'Mencetak...' : 'Cetak semua siswa'}</button>
      </div>
      {hasil && <p><a href={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}${hasil}`} target="_blank" rel="noreferrer">Unduh PDF</a></p>}
      <table>
        <thead><tr><th>Siswa</th><th>NIS</th><th>Cetak ke-</th><th></th></tr></thead>
        <tbody>{lembar.map((l) => <tr key={l.id}><td>{l.name}</td><td>{l.nis}</td><td>{l.print_count}</td><td><button onClick={() => cetakUlang(l.id)}>Cetak ulang</button></td></tr>)}</tbody>
      </table>
    </div>
  );
}
