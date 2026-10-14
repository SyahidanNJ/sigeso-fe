import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Kelas() {
  const [kelas, setKelas] = useState([]);
  const [aktif, setAktif] = useState(null);
  const [siswa, setSiswa] = useState([]);
  const [form, setForm] = useState({ name: '', academic_year: '2026/2027', level: 7 });
  const [csv, setCsv] = useState('Budi,1001\nAni,1002');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function muatKelas() {
    try {
      const r = await api.get('/classes');
      setKelas(r.data.data);
      if (r.data.data[0] && !aktif) setAktif(r.data.data[0]);
    } catch (e) { setMsg(e.userMessage || e.message); }
  }
  useEffect(() => { muatKelas(); }, []);
  useEffect(() => {
    if (!aktif) return;
    api.get(`/students?class_id=${aktif.id}`).then((r) => setSiswa(r.data.data)).catch((e) => setMsg(e.userMessage || e.message));
  }, [aktif]);

  async function tambah(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/classes', { ...form, level: Number(form.level) });
      setMsg('');
      muatKelas();
    } catch (err) { setMsg(err.userMessage || err.message); } finally { setLoading(false); }
  }
  async function impor() {
    setLoading(true);
    try {
      const rows = csv.split('\n').map((b) => b.split(',')).filter((p) => p[0]?.trim()).map(([name, nis]) => ({ name: name.trim(), nis: (nis || '').trim() }));
      const r = await api.post('/students/import', { class_id: aktif.id, rows });
      setMsg(`${r.data.data.imported} siswa diimpor.`);
      const s = await api.get(`/students?class_id=${aktif.id}`);
      setSiswa(s.data.data);
    } catch (err) { setMsg(err.userMessage || err.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="kartu">
        <h2>Kelas</h2>
        {msg && <p className="pesan gagal">{msg}</p>}
        <div className="baris">
          {kelas.map((k) => <button key={k.id} onClick={() => setAktif(k)} style={{ background: aktif?.id === k.id ? '#1d4ed8' : '#64748b' }}>{k.name}</button>)}
        </div>
        <form onSubmit={tambah} style={{ marginTop: 12 }}>
          <div className="baris">
            <input placeholder="Nama kelas" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Tahun ajaran" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
            <input placeholder="Tingkat" type="number" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </div>
          <button disabled={loading}>{loading ? 'Menyimpan...' : 'Tambah kelas'}</button>
        </form>
      </div>
      {aktif && (
        <div className="kartu">
          <h2>Siswa — {aktif.name}</h2>
          <table>
            <thead><tr><th>Nama</th><th>NIS</th></tr></thead>
            <tbody>{siswa.map((s) => <tr key={s.id}><td>{s.name}</td><td>{s.nis}</td></tr>)}</tbody>
          </table>
          <h3>Impor CSV (nama,nis per baris)</h3>
          <textarea rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} />
          <button onClick={impor} disabled={loading}>{loading ? 'Mengimpor...' : 'Impor'}</button>
        </div>
      )}
    </div>
  );
}
