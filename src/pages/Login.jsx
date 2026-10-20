import { useState } from 'react';
import { Alert, Anchor, Button, Container, Paper, PasswordInput, TextInput, Title } from '@mantine/core';
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
      const r = await api.post('/auth/login', { email: form.email.trim(), password: form.password }, { silent: true });
      localStorage.setItem('sigeso_token', r.data.data.token);
      localStorage.setItem('sigeso_user', JSON.stringify(r.data.data.user));
      nav('/');
    } catch (err) {
      setMsg(err.userMessage || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Container size={380} my={60}>
      <Title ta="center" mb="md">Sigeso</Title>
      <Paper withBorder shadow="xs" p="md">
        <form onSubmit={submit}>
          <TextInput label="Email" placeholder="cth: nama@sekolah.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} mb="sm" />
          <PasswordInput label="Kata sandi" placeholder="Ketik kata sandi" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} mb="md" />
          <Button type="submit" fullWidth loading={loading}>Masuk</Button>
        </form>
        {msg && <Alert color="red" mt="md">{msg}</Alert>}
        <Anchor component={Link} to="/register" mt="sm" display="block">Belum punya akun? Daftar</Anchor>
      </Paper>
    </Container>
  );
}
