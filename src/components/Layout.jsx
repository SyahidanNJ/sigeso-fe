import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const nav = useNavigate();
  function keluar() {
    localStorage.removeItem('sigeso_token');
    nav('/login');
  }
  return (
    <div className="layout">
      <nav className="side">
        <h2>Sigeso</h2>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'aktif' : '')}>Dashboard</NavLink>
        <NavLink to="/sekolah" className={({ isActive }) => (isActive ? 'aktif' : '')}>Sekolah</NavLink>
        <NavLink to="/kelas" className={({ isActive }) => (isActive ? 'aktif' : '')}>Kelas & Siswa</NavLink>
        <NavLink to="/materi" className={({ isActive }) => (isActive ? 'aktif' : '')}>Materi</NavLink>
        <button onClick={keluar} style={{ marginTop: 'auto', background: '#334155' }}>Keluar</button>
      </nav>
      <main className="konten">
        <Outlet />
      </main>
    </div>
  );
}
