import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Materi() {
  const [mapel, setMapel] = useState([]);
  const [topik, setTopik] = useState([]);
  const [bab, setBab] = useState([]);
  const [sub, setSub] = useState([]);
  const [nama, setNama] = useState('');
  const [msg, setMsg] = useState('');
  const [pilih, setPilih] = useState({});

  async function muat() {
    try {
      const r = await api.get('/subjects');
      setMapel(r.data.data);
    } catch (e) { setMsg(e.userMessage || e.message); }
  }
  useEffect(() => { muat(); }, []);

  async function tambahMapel() {
    await api.post('/subjects', { name: nama });
    setNama('');
    muat();
  }
  async function tambahJenjang(url, body, after) {
    await api.post(url, body);
    after();
  }

  return (
    <div className="kartu">
      <h2>Materi: Mapel &gt; Topik &gt; Bab &gt; Subbab</h2>
      {msg && <p className="pesan gagal">{msg}</p>}
      <div className="baris">
        <input placeholder="Mapel baru" value={nama} onChange={(e) => setNama(e.target.value)} />
        <button onClick={tambahMapel}>+ Mapel</button>
      </div>
      <div className="baris" style={{ marginTop: 8 }}>
        <select onChange={async (e) => { setPilih({ ...pilih, subject_id: e.target.value }); const r = await api.get(`/topics?subject_id=${e.target.value}`); setTopik(r.data.data); }}>
          <option value="">— Mapel —</option>
          {mapel.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select onChange={async (e) => { setPilih({ ...pilih, topic_id: e.target.value }); const r = await api.get(`/chapters?topic_id=${e.target.value}`); setBab(r.data.data); }}>
          <option value="">— Topik —</option>
          {topik.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select onChange={async (e) => { setPilih({ ...pilih, chapter_id: e.target.value }); const r = await api.get(`/subchapters?chapter_id=${e.target.value}`); setSub(r.data.data); }}>
          <option value="">— Bab —</option>
          {bab.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <ul>{sub.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
      <div className="baris">
        <button onClick={() => tambahJenjang('/topics', { subject_id: Number(pilih.subject_id), grade_level: 7, name: nama }, () => setMsg('Topik ditambah, pilih ulang mapel.'))}>+ Topik</button>
        <button onClick={() => tambahJenjang('/chapters', { topic_id: Number(pilih.topic_id), name: nama }, () => setMsg('Bab ditambah.'))}>+ Bab</button>
        <button onClick={() => tambahJenjang('/subchapters', { chapter_id: Number(pilih.chapter_id), name: nama }, () => setMsg('Subbab ditambah.'))}>+ Subbab</button>
      </div>
    </div>
  );
}
