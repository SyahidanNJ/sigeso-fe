import { useEffect } from 'react';

export default function Modal({ judul, tutup, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') tutup(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [tutup]);
  return (
    <div onClick={tutup} style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / .5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="kartu" style={{ margin: 0, maxWidth: 420, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>{judul}</h2>
        {children}
      </div>
    </div>
  );
}
