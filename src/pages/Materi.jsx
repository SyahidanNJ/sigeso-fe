import { useEffect, useState } from 'react';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

export default function Materi() {
  const [mapel, setMapel] = useState([]);
  const [topik, setTopik] = useState([]);
  const [bab, setBab] = useState([]);
  const [sub, setSub] = useState([]);
  const [nama, setNama] = useState('');
  const [msg, setMsg] = useState('');
  const [pilih, setPilih] = useState({});
  const [sumber, setSumber] = useState([]);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function muat() {
    try {
      const r = await api.get('/subjects');
      setMapel(r.data.data);
    } catch (e) { setMsg(e.userMessage || e.message); }
  }
  useEffect(() => { muat(); }, []);

  async function muatSumber(subId) {
    try {
      const r = await api.get(`/sources?sub_chapter_id=${subId}`);
      setSumber(r.data.data);
    } catch (e) { setMsg(e.userMessage || e.message); }
  }

  async function tambahMapel() {
    setLoading(true);
    try {
      await api.post('/subjects', { name: nama });
      setNama('');
      muat();
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }

  async function unggah() {
    if (!file || !pilih.sub_chapter_id) { setMsg('Pilih subbab dan file dulu.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sub_chapter_id', pilih.sub_chapter_id);
      const r = await api.post('/sources/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg(`Diunggah: ${r.data.data.chars} karakter.`);
      muatSumber(pilih.sub_chapter_id);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }

  async function tambahUrl() {
    if (!url || !pilih.sub_chapter_id) { setMsg('Pilih subbab dan isi URL dulu.'); return; }
    setLoading(true);
    try {
      const r = await api.post('/sources/url', { url, sub_chapter_id: Number(pilih.sub_chapter_id) });
      setMsg(`Tersimpan: ${r.data.data.chars} karakter dari ${url}.`);
      setUrl('');
      muatSumber(pilih.sub_chapter_id);
    } catch (e) { setMsg(e.userMessage || e.message); } finally { setLoading(false); }
  }

  const cariNama = (arr, id) => (arr.find((x) => String(x.id) === String(id)) || {}).name;
  const jejak = [cariNama(mapel, pilih.subject_id), cariNama(topik, pilih.topic_id), cariNama(bab, pilih.chapter_id)].filter(Boolean).join('  ›  ');

  return (
    <div>
      <div className="kepala"><h2>Materi</h2><span className="sub">Mapel › Topik › Bab › Subbab</span></div>
      <Panduan id="materi" steps={['Pilih Mapel, lalu Topik, lalu Bab.', 'Kalau Subbab belum ada, ketik namanya lalu tekan + Subbab.', 'Klik nama Subbab, lalu Unggah file materi atau tempel link.']} />
      <div className="kartu">
        <h2>Materi: Mapel &gt; Topik &gt; Bab &gt; Subbab</h2>
        {jejak && <p className="sub">Posisi: {jejak}</p>}
        {msg && <p className="pesan gagal">{msg}</p>}
        <div className="lbl">Nama baru (untuk mapel, topik, bab, atau subbab)</div>
        <div className="baris">
          <input placeholder="Nama baru (mapel/topik/bab/subbab)" value={nama} onChange={(e) => setNama(e.target.value)} />
          <button onClick={tambahMapel} disabled={loading}>+ Mapel</button>
        </div>
        <div className="baris" style={{ marginTop: 8 }}>
          <div><div className="lbl">Mapel</div><select onChange={async (e) => { setPilih({ ...pilih, subject_id: e.target.value }); const r = await api.get(`/topics?subject_id=${e.target.value}`); setTopik(r.data.data); }}>
            <option value="">— Mapel —</option>
            {mapel.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select></div>
          <div><div className="lbl">Topik</div><select onChange={async (e) => { setPilih({ ...pilih, topic_id: e.target.value }); const r = await api.get(`/chapters?topic_id=${e.target.value}`); setBab(r.data.data); }}>
            <option value="">— Topik —</option>
            {topik.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></div>
          <div><div className="lbl">Bab</div><select onChange={async (e) => { setPilih({ ...pilih, chapter_id: e.target.value }); const r = await api.get(`/subchapters?chapter_id=${e.target.value}`); setSub(r.data.data); }}>
            <option value="">— Bab —</option>
            {bab.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select></div>
        </div>
        <div className="baris" style={{ marginTop: 8 }}>
          <button onClick={async () => { await api.post('/topics', { subject_id: Number(pilih.subject_id), grade_level: 7, name: nama }); setMsg('Topik ditambah.'); }} disabled={loading}>+ Topik</button>
          <button onClick={async () => { await api.post('/chapters', { topic_id: Number(pilih.topic_id), name: nama }); setMsg('Bab ditambah.'); }} disabled={loading}>+ Bab</button>
          <button onClick={async () => { const r = await api.post('/subchapters', { chapter_id: Number(pilih.chapter_id), name: nama }); setMsg('Subbab ditambah.'); setSub([...sub, r.data.data]); }} disabled={loading}>+ Subbab</button>
        </div>
        {sub.length === 0 ? (pilih.chapter_id ? <Kosong teks="Belum ada subbab di bab ini. Ketik namanya di atas lalu tekan + Subbab." /> : null) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {sub.map((s) => <button key={s.id} className={pilih.sub_chapter_id === s.id ? '' : 'btn2'} style={{ textAlign: 'left' }} onClick={() => { setPilih({ ...pilih, sub_chapter_id: s.id }); muatSumber(s.id); }}>{s.name}</button>)}
        </div>
        )}
      </div>
      {pilih.sub_chapter_id && (
        <div className="kartu">
          <h2>Sumber materi (PDF/DOCX/TXT atau URL)</h2>
          <table>
            <thead><tr><th>Jenis</th><th>Sumber</th><th>Status</th></tr></thead>
            <tbody>{sumber.map((s) => <tr key={s.id}><td>{s.kind}</td><td>{s.original_url || s.file_path || '-'}</td><td>{s.status}</td></tr>)}</tbody>
          </table>
          <div className="baris" style={{ marginTop: 8 }}>
            <div><div className="lbl">Berkas materi (PDF, DOCX, atau TXT)</div><input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} /></div>
            <div><div className="lbl">&nbsp;</div><button onClick={unggah} disabled={loading}>{loading ? 'Mengunggah...' : 'Unggah'}</button></div>
          </div>
          <div className="baris">
            <div><div className="lbl">Link materi (diawali https://)</div><input placeholder="cth: https://belajar.id/materi/..." value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            <div><div className="lbl">&nbsp;</div><button onClick={tambahUrl} disabled={loading}>{loading ? 'Menyimpan...' : '+ URL'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
