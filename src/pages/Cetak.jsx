import { useEffect, useState } from 'react';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

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
    <>
      <Panduan id="cetak" steps={['Pilih ujian.', 'Tekan Cetak semua siswa, unduh PDF-nya untuk difotokopi.', 'Kalau ada kertas rusak, tekan Cetak ulang pada nama anak itu.']} />
    <div className="kartu">
      <div className="kepala"><h2>Cetak lembar</h2><span className="sub">satu-lembar ber-QR per siswa</span></div>
      {msg && <p className="pesan gagal">{msg}</p>}
      <div className="baris">
        <div><div className="lbl">Pilih ujian</div><select value={aktif} onChange={(e) => setAktif(e.target.value)}>
          {ujian.map((u) => <option key={u.id} value={u.id}>{u.title} ({u.n_soal} soal)</option>)}
        </select></div>
        <div><div className="lbl">&nbsp;</div><button onClick={cetak} disabled={loading || !aktif}>{loading ? 'Mencetak...' : 'Cetak semua siswa'}</button></div>
      </div>
      {hasil && <p><a href={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}${hasil}`} target="_blank" rel="noreferrer">Unduh PDF</a></p>}
      {lembar.length === 0 ? <Kosong teks="Belum ada lembar. Pilih ujian lalu tekan Cetak semua siswa." /> : (
      <table>
        <thead><tr><th>Siswa</th><th>NIS</th><th>Cetak</th><th></th></tr></thead>
        <tbody>{lembar.map((l) => <tr key={l.id}><td>{l.name}</td><td>{l.nis}</td><td><span className="lencana l-abu">{l.print_count}x</span></td><td><button onClick={() => cetakUlang(l.id)}>Cetak ulang</button></td></tr>)}</tbody>
      </table>
      )}
    </div>
    </>
  );
}
