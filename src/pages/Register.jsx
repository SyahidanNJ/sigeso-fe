import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const nav = useNavigate();
  const [sekolah, setSekolah] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', institution_id: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/institutions').then((r) => {
      setSekolah(r.data.data);
      if (r.data.data[0]) setForm((f) => ({ ...f, institution_id: r.data.data[0].id }));
    }).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/register', { ...form, institution_id: Number(form.institution_id) });
      localStorage.setItem('sigeso_token', r.data.data.token);
      nav('/');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ maxWidth: 360, margin: '60px auto' }}>
      <h1>Daftar akun guru</h1>
      <form onSubmit={submit}>
        <input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password (min 6)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select value={form.institution_id} onChange={(e) => setForm({ ...form, institution_id: e.target.value })}>
          {sekolah.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button disabled={loading}>{loading ? 'Mendaftar...' : 'Daftar'}</button>
      </form>
      <p><Link to="/login">Sudah punya akun? Masuk</Link></p>
    </div>
  );
}
