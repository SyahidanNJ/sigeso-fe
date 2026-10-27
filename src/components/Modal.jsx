import { useEffect } from 'react';

// Judul tetap di atas, isi modal yang bergulir. Scrollbar ditaruh di dalam
// kartu yang ber-overflow hidden supaya keempat sudutnya tetap melengkung.
export default function Modal({ judul, tutup, children, lebar = 420 }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') tutup(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [tutup]);
  return (
    <div onClick={tutup} style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / .5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="kartu"
        style={{
          margin: 0, maxWidth: lebar, width: '100%', maxHeight: '88vh',
          padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        <h2 style={{ margin: 0, padding: '18px 18px 12px' }}>{judul}</h2>
        <div style={{ padding: '0 18px 18px', overflowY: 'auto', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}
