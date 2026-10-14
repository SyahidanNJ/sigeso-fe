import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Nilai() {
  const [ujian, setUjian] = useState([]);
  const [exam, setExam] = useState('1');
  const [daftar, setDaftar] = useState([]);
  const [qr, setQr] = useState('');
  const [files, setFiles] = useState([]);
  const [skor, setSkor] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function muat(id) {
    try {
      const r = await api.get(`/submissions?exam_id=${id}`);
      setDaftar(r.data.data);
      const awal = {};
      r.data.data.forEach((s) => { awal[s.id] = s.final_score ?? ''; });
      setSkor(awal);
    } catch (e) { setMsg(e.userMessage || e.message); }
  }
  useEffect(() => {
    api.get('/exams').then((r) => setUjian(r.data.data)).catch((e) => setMsg(e.userMessage || e.message));
    muat(exam);
  }, []);

  async function unggah() {
    if (!files.length || !qr) { setMsg('Isi QR dan pilih foto dulu.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      [...files].slice(0, 5).forEach((f) => fd.append('foto', f));
      fd.append('qr_code', qr);
      const r = await api.post('/submissions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg(`PG ${r.data.data.pg_score}. Wajib review sebelum kunci.`);
      muat(exam);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }
  async function koreksi(id) {
    setLoading(true);
    try {
      await api.patch(`/submissions/${id}/review`, { final_score: Number(skor[id]) });
      setMsg('Koreksi tersimpan.');
      muat(exam);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }
  async function kunci(id) {
    setLoading(true);
    try {
      await api.post(`/submissions/${id}/finalize`, {});
      setMsg('Nilai final dan terkunci.');
      muat(exam);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="kartu">
        <h2>Unggah foto jawaban</h2>
        {msg && <p className="pesan gagal">{msg}</p>}
        <div className="baris">
          <input placeholder="Kode QR (cth SGxxx:p1)" value={qr} onChange={(e) => setQr(e.target.value)} />
          <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={(e) => setFiles(e.target.files)} />
          <button onClick={unggah} disabled={loading}>{loading ? 'Menilai...' : 'Unggah & nilai'}</button>
        </div>
      </div>
      <div className="kartu">
        <h2>Review nilai</h2>
        <div className="baris">
          <select value={exam} onChange={(e) => { setExam(e.target.value); muat(e.target.value); }}>
            {ujian.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>Siswa</th><th>PG</th><th>Final</th><th>Status</th><th></th></tr></thead>
          <tbody>{daftar.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td><td>{s.pg_score}</td>
              <td><input type="number" min="0" max="100" value={skor[s.id] ?? ''} onChange={(e) => setSkor({ ...skor, [s.id]: e.target.value })} style={{ width: 80 }} /></td>
              <td>{s.status}</td>
              <td>
                {s.status !== 'final' && <><button onClick={() => koreksi(s.id)}>Simpan</button> <button onClick={() => kunci(s.id)} style={{ background: '#166534' }}>Kunci</button></>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
