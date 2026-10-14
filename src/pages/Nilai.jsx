import { useEffect, useState } from 'react';
import api, { unduhBerkas } from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

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
  async function ekspor(format) {
    setLoading(true);
    try {
      const r = await api.get(`/exams/${exam}/export?format=${format}`);
      setMsg(r.data.message);
      await unduhBerkas(r.data.data.download);
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

  const final = daftar.filter((s) => s.status === 'final');
  const rata = final.length ? Math.round(final.reduce((a, s) => a + Number(s.final_score || 0), 0) / final.length) : '-';

  return (
    <div>
      <div className="kepala"><h2>Nilai</h2><span className="sub">{daftar.length} siswa dinilai</span></div>
      <div className="angka">
        <div className="stat"><b>{rata}</b><span>Rata-rata final</span></div>
        <div className="stat"><b>{final.length}</b><span>Sudah dikunci</span></div>
        <div className="stat"><b>{daftar.length - final.length}</b><span>Perlu review</span></div>
      </div>
      <Panduan id="nilai" steps={['Lihat kode QR di kertas anak, ketik di kolom QR.', 'Pilih foto kertasnya (bisa lebih dari 1), tekan Unggah & nilai.', 'Periksa nilainya, ubah kalau salah, lalu tekan Kunci.']} />
      <div className="kartu">
        <h2>Unggah foto jawaban</h2>
        {msg && <p className="pesan gagal">{msg}</p>}
        <div className="baris">
          <div><div className="lbl">Kode QR dari kertas</div><input placeholder="cth: SGxxx:p1" value={qr} onChange={(e) => setQr(e.target.value)} /></div>
          <div><div className="lbl">Foto lembar jawaban (bisa pilih lebih dari 1)</div><input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={(e) => setFiles(e.target.files)} /></div>
          <div><div className="lbl">&nbsp;</div><button onClick={unggah} disabled={loading}>{loading ? 'Menilai...' : 'Unggah & nilai'}</button></div>
        </div>
      </div>
      <div className="kartu">
        <h2>Review nilai</h2>
        <div className="baris">
          <div><div className="lbl">Pilih ujian</div><select value={exam} onChange={(e) => { setExam(e.target.value); muat(e.target.value); }}>
            {ujian.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
          </select></div>
          <button onClick={() => ekspor('xlsx')} disabled={loading}>Excel</button>
          <button onClick={() => ekspor('pdf')} disabled={loading}>PDF</button>
          <button onClick={() => ekspor('docx')} disabled={loading}>Word</button>
        </div>
        {daftar.length === 0 ? <Kosong teks="Belum ada nilai. Unggah foto jawaban di atas." /> : (
        <table>
          <thead><tr><th>Siswa</th><th>PG</th><th>Final</th><th>Status</th><th></th></tr></thead>
          <tbody>{daftar.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td><td>{s.pg_score}</td>
              <td><input type="number" min="0" max="100" value={skor[s.id] ?? ''} onChange={(e) => setSkor({ ...skor, [s.id]: e.target.value })} style={{ width: 80 }} /></td>
              <td><span className={`lencana ${s.status === 'final' ? 'l-hijau' : 'l-amber'}`}>{s.status === 'final' ? 'Terkunci' : 'Review'}</span></td>
              <td>
                {s.status !== 'final' && <><button onClick={() => koreksi(s.id)}>Simpan</button> <button onClick={() => kunci(s.id)} style={{ background: '#0f766e' }}>Kunci</button></>}
              </td>
            </tr>
          ))}</tbody>
        </table>
        )}
      </div>
    </div>
  );
}
