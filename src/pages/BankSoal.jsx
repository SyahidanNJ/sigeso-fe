import { useEffect, useState } from 'react';
import api from '../lib/api';
import Panduan from '../components/Panduan';

export default function BankSoal() {
  const [daftar, setDaftar] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [gen, setGen] = useState({ sub_chapter_id: 1, count: 3, difficulty: 'mudah' });

  async function muat() {
    try {
      const r = await api.get('/questions');
      setDaftar(r.data.data);
    } catch (e) { setMsg(e.userMessage || e.message); }
  }
  useEffect(() => { muat(); }, []);

  async function generate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/generate', { ...gen, sub_chapter_id: Number(gen.sub_chapter_id), count: Number(gen.count), qtypes: ['PG', 'ISIAN', 'URAIAN'] });
      setMsg(r.data.message);
      muat();
    } catch (err) { setMsg(err.userMessage || err.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <Panduan id="bank" steps={['Isi nomor Subbab dan jumlah soal, tekan Generate, tunggu sebentar.', 'Baca hasilnya satu-satu.', 'Soal yang jelek dihapus saja.']} />
      <div className="kartu">
        <h2>Generate soal (AI)</h2>
        {msg && <p className="pesan gagal">{msg}</p>}
        <form onSubmit={generate}>
          <div className="baris">
            <div><div className="lbl">Nomor Subbab</div><input placeholder="cth: 1" type="number" value={gen.sub_chapter_id} onChange={(e) => setGen({ ...gen, sub_chapter_id: e.target.value })} /></div>
            <div><div className="lbl">Jumlah soal (1–20)</div><input placeholder="cth: 5" type="number" min="1" max="20" value={gen.count} onChange={(e) => setGen({ ...gen, count: e.target.value })} /></div>
            <div><div className="lbl">Tingkat kesulitan</div><select value={gen.difficulty} onChange={(e) => setGen({ ...gen, difficulty: e.target.value })}>
              <option value="mudah">mudah</option><option value="sedang">sedang</option><option value="sukar">sukar</option>
            </select></div>
          </div>
          <button disabled={loading}>{loading ? 'Membuat... (±30 dtk)' : 'Generate'}</button>
        </form>
      </div>
      <div className="kartu">
        <h2>Bank soal ({daftar.length})</h2>
        <table>
          <thead><tr><th>ID</th><th>Tipe</th><th>Soal</th><th>Kunci</th></tr></thead>
          <tbody>{daftar.map((q) => <tr key={q.id}><td>{q.id}</td><td>{q.qtype}</td><td>{q.text.slice(0, 80)}</td><td>{q.answer_key}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
