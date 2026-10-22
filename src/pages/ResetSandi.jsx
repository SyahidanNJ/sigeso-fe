import { useState } from 'react';
import { Alert, Anchor, Button, Container, Paper, PasswordInput, Text, Title } from '@mantine/core';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function ResetSandi() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ baru: '', ulang: '' });
  const [pesan, setPesan] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (form.baru.length < 6) return setErr('Kata sandi baru minimal 6 huruf.');
    if (form.baru !== form.ulang) return setErr('Ulangi kata sandi belum sama.');
    setLoading(true);
    try {
      const r = await api.post('/auth/reset', { token, baru: form.baru }, { silent: true });
      setPesan(r.data.message);
    } catch (e2) {
      setErr(e2.userMessage || 'Gagal mengganti kata sandi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Container size={420} my={60}>
        <Title ta="center" mb="md">Sigeso</Title>
        <Paper withBorder shadow="xs" p="md">
          <Alert color="yellow">Tautan tidak lengkap. Minta tautan baru dari halaman lupa sandi.</Alert>
          <Anchor component={Link} to="/lupa-sandi" mt="md" display="block">Minta tautan baru</Anchor>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={60}>
      <Title ta="center" mb="md">Sigeso</Title>
      <Paper withBorder shadow="xs" p="md">
        {pesan ? (
          <>
            <Alert color="teal">{pesan}</Alert>
            <Button component={Link} to="/login" fullWidth mt="md">Ke halaman masuk</Button>
          </>
        ) : (
          <form onSubmit={submit}>
            <Text size="sm" c="dimmed" mb="sm">Buat kata sandi baru untuk akun Anda.</Text>
            <PasswordInput label="Kata sandi baru" placeholder="Minimal 6 huruf" value={form.baru} onChange={(e) => setForm({ ...form, baru: e.target.value })} mb="sm" />
            <PasswordInput label="Ulangi kata sandi baru" placeholder="Ketik ulang" value={form.ulang} onChange={(e) => setForm({ ...form, ulang: e.target.value })} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Simpan kata sandi</Button>
          </form>
        )}
        {err && <Alert color="red" mt="md">{err}</Alert>}
      </Paper>
    </Container>
  );
}
