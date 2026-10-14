import { useEffect, useState } from 'react';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

export default function Ujian() {
  const [ujian, setUjian] = useState([]);
  const [bank, setBank] = useState([]);
  const [aktif, setAktif] = useState(null);
  const [dipilih, setDipilih] = useState([]);
  const [form, setForm] = useState({ title: '', class_id: 1 });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function muat() {
    const u = await api.get('/exams');
    setUjian(u.data.data);
    const b = await api.get('/questions');
    setBank(b.data.data);
    if (u.data.data[0] && !aktif) {
      setAktif(u.data.data[0]);
      const it = await api.get(`/exams/${u.data.data[0].id}/items`);
      setDipilih(it.data.data.map((x) => x.id));
    }
  }
  useEffect(() => { muat().catch((e) => setMsg(e.userMessage || e.message)); }, []);

  async function buat(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/exams', { ...form, class_id: Number(form.class_id) });
      setMsg('');
      muat();
    } catch (err) { setMsg(err.userMessage || err.message); } finally { setLoading(false); }
  }
  function centang(id) {
    setDipilih(dipilih.includes(id) ? dipilih.filter((x) => x !== id) : [...dipilih, id]);
  }
  async function simpan() {
    setLoading(true);
    try {
      const r = await api.put(`/exams/${aktif.id}/items`, { question_ids: dipilih });
      setMsg(`${r.data.data.count} soal ditempel ke "${aktif.title}". Jumlah bebas.`);
      muat();
    } catch (err) { setMsg(err.userMessage || err.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <Panduan id="ujian" steps={['Ketik judul ujian, tekan + Ujian.', 'Klik Pilih pada ujian itu.', 'Centang soal yang mau dipakai, tekan Simpan pilihan.']} />
      <div className="kartu">
        <div className="kepala"><h2>Ujian</h2><span className="sub">{ujian.length} ujian</span></div>
        {msg && <p className="pesan gagal">{msg}</p>}
        {ujian.length === 0 ? <Kosong teks="Belum ada ujian. Buat lewat form di bawah." /> : (
        <table>
          <thead><tr><th>Judul</th><th>N soal</th><th></th></tr></thead>
          <tbody>{ujian.map((u) => <tr key={u.id} style={aktif?.id === u.id ? { background: '#e0efec' } : null}><td>{u.title}</td><td>{u.n_soal}</td><td><button onClick={async () => { setAktif(u); const it = await api.get(`/exams/${u.id}/items`); setDipilih(it.data.data.map((x) => x.id)); }}>Pilih</button></td></tr>)}</tbody>
        </table>
        )}
        <form onSubmit={buat} style={{ marginTop: 8 }}>
          <div className="baris">
            <div><div className="lbl">Judul ujian</div><input placeholder="cth: Ulangan Bab 1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><div className="lbl">Nomor kelas</div><input placeholder="cth: 1" type="number" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} /></div>
          </div>
          <button disabled={loading}>+ Ujian</button>
        </form>
      </div>
      {aktif && (
        <div className="kartu">
          <div className="kepala"><h2>Tempel soal ke: {aktif.title}</h2><span className="lencana l-teal">{dipilih.length} dipilih</span></div>
          {bank.length === 0 ? <Kosong teks="Bank soal kosong. Buat dulu di halaman Bank Soal." /> : (
          <table>
            <thead><tr><th></th><th>Tipe</th><th>Soal</th></tr></thead>
            <tbody>{bank.map((q) => <tr key={q.id}><td><input type="checkbox" checked={dipilih.includes(q.id)} onChange={() => centang(q.id)} /></td><td>{q.qtype}</td><td>{q.text.slice(0, 80)}</td></tr>)}</tbody>
          </table>
          )}
          <button onClick={simpan} disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Menyimpan...' : 'Simpan pilihan'}</button>
        </div>
      )}
    </div>
  );
}
