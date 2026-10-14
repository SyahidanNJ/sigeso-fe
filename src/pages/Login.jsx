import { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const r = await api.post('/auth/login', form);
      localStorage.setItem('sigeso_token', r.data.data.token);
      nav('/');
    } catch (err) {
      setMsg(err.userMessage || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ maxWidth: 360, margin: '60px auto' }}>
      <h1>Sigeso</h1>
      <form onSubmit={submit}>
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <button disabled={loading}>{loading ? 'Masuk...' : 'Masuk'}</button>
      </form>
      {msg && <p>{msg}</p>}
      <p><Link to="/register">Belum punya akun? Daftar</Link></p>
    </div>
  );
}
