import { useEffect, useState } from 'react';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

export default function Sekolah() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api.get('/institutions').then((r) => setData(r.data.data)).catch((e) => setMsg(e.userMessage || e.message));
  }, []);
  const aktif = data[0];
  return (
    <div>
      <div className="kepala"><h2>Sekolah</h2><span className="sub">Identitas institusi</span></div>
      <Panduan id="sekolah" steps={['Halaman ini menampilkan data sekolah Anda.', 'Untuk mengubahnya, hubungi admin sekolah.']} />
      {msg && <p className="pesan gagal">{msg}</p>}
      {!aktif ? <div className="kartu"><Kosong teks="Data sekolah belum ada." /></div> : (
      <div className="kartu">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--primer)', color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(aktif.name || '?').trim()[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{aktif.name}</div>
            <div style={{ color: '#41605a' }}>{aktif.address || 'Alamat belum diisi'}</div>
            <div><span className="lencana l-teal">NPSN: {aktif.npsn || '-'}</span></div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
