import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export default function PopupProvider({ children }) {
  const [antre, setAntre] = useState([]);
  const dorong = useCallback((teks, tipe) => {
    setAntre((a) => [...a, { teks, tipe }]);
  }, []);
  const tutup = useCallback(() => setAntre((a) => a.slice(1)), []);
  const aktif = antre[0];
  const ok = aktif?.tipe === 'ok';

  return (
    <Ctx.Provider value={dorong}>
      {children}
      {aktif && (
        <div onClick={tutup} style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / .5)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="kartu" style={{ margin: 0, maxWidth: 420, width: '100%', borderTop: `6px solid ${ok ? '#166534' : '#991b1b'}` }}>
            <h2 style={{ marginTop: 0 }}>{ok ? '✓ Berhasil' : '✕ Gagal'}</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{aktif.teks}</p>
            {antre.length > 1 && <p style={{ color: '#64748b' }}>+{antre.length - 1} pesan lain menunggu</p>}
            <button onClick={tutup} style={{ width: '100%', background: ok ? '#166534' : '#991b1b' }}>OK</button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
