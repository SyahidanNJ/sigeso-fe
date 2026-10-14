import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Sekolah() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api.get('/institutions').then((r) => setData(r.data.data)).catch((e) => setMsg(e.userMessage || e.message));
  }, []);
  return (
    <div className="kartu">
      <h2>Sekolah / Institusi</h2>
      {msg && <p className="pesan gagal">{msg}</p>}
      <table>
        <thead><tr><th>Nama</th><th>Alamat</th><th>NPSN</th></tr></thead>
        <tbody>{data.map((i) => <tr key={i.id}><td>{i.name}</td><td>{i.address}</td><td>{i.npsn || '-'}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
