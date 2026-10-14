import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);
let n = 0;

export default function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([]);
  const tutup = useCallback((id) => setDaftar((d) => d.filter((t) => t.id !== id)), []);
  const dorong = useCallback((teks, tipe) => {
    const id = ++n;
    setDaftar((d) => [...d.slice(-2), { id, teks, tipe }]);
    setTimeout(() => tutup(id), 5000);
  }, [tutup]);

  return (
    <Ctx.Provider value={dorong}>
      {children}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 99, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
        {daftar.map((t) => (
          <div key={t.id} onClick={() => tutup(t.id)} className={`pesan ${t.tipe === 'ok' ? 'ok' : 'gagal'}`} style={{ margin: 0, cursor: 'pointer', boxShadow: '0 2px 8px rgb(0 0 0/.2)' }}>
            {t.teks}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
