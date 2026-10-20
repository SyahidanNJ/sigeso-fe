import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '@mantine/core';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export default function PopupProvider({ children }) {
  const [antre, setAntre] = useState([]);
  const dorong = useCallback((teks, tipe, meta) => {
    setAntre((a) => [...a, { teks, tipe, meta }]);
  }, []);
  const tutup = useCallback(() => setAntre((a) => a.slice(1)), []);
  const aktif = antre[0];
  const ok = aktif?.tipe === 'ok';
  useEffect(() => {
    if (!aktif) return;
    const esc = (e) => { if (e.key === 'Escape') tutup(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aktif, tutup]);

  return (
    <Ctx.Provider value={dorong}>
      {children}
      {aktif && (
        <div onClick={tutup} style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / .5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="kartu" style={{ margin: 0, maxWidth: 420, width: '100%', borderTop: `6px solid ${ok ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'}` }}>
            <h2 style={{ marginTop: 0 }}>{ok ? '✓ Berhasil' : '✕ Gagal'}</h2>
            <p className="popup-teks">{aktif.teks}</p>
            {aktif.meta && <p style={{ color: '#94a3b8', fontSize: 12 }}>{aktif.meta}</p>}
            {antre.length > 1 && <p style={{ color: '#64748b' }}>+{antre.length - 1} pesan lain menunggu</p>}
            <Button fullWidth color={ok ? 'teal' : 'red'} onClick={tutup}>OK</Button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
