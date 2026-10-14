import { useState } from 'react';

export default function Panduan({ id, steps }) {
  const kunci = `pdn-${id}`;
  const [buka, setBuka] = useState(() => {
    try { return localStorage.getItem(kunci) !== 'tutup'; } catch { return true; }
  });
  function alih() {
    const v = !buka;
    setBuka(v);
    try { localStorage.setItem(kunci, v ? 'buka' : 'tutup'); } catch { /* abaikan */ }
  }
  return (
    <div className="kartu">
      <button onClick={alih} style={{ background: 'var(--aksen)', width: '100%' }}>Cara pakai {buka ? '▲' : '▼'}</button>
      {buka && <ol style={{ fontSize: 17, lineHeight: 1.8 }}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
    </div>
  );
}
