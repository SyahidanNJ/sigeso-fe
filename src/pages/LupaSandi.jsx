import { useState } from 'react';
import { Alert, Anchor, Button, Container, Paper, Text, TextInput, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function LupaSandi() {
  const [email, setEmail] = useState('');
  const [pesan, setPesan] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const r = await api.post('/auth/forgot', { email: email.trim() }, { silent: true });
      setPesan(r.data.message);
    } catch (e2) {
      setErr(e2.userMessage || 'Gagal mengirim tautan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size={420} my={60}>
      <Title ta="center" mb="md">Sigeso</Title>
      <Paper withBorder shadow="xs" p="md">
        {pesan ? (
          <>
            <Alert color="teal">{pesan}</Alert>
            <Text size="sm" mt="sm">Tidak menerima email? Tunggu beberapa menit, cek folder spam, lalu coba lagi.</Text>
            <Button variant="light" fullWidth mt="md" onClick={() => { setPesan(''); setEmail(''); }}>Kirim ke email lain</Button>
          </>
        ) : (
          <form onSubmit={submit}>
            <Text size="sm" c="dimmed" mb="sm">Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.</Text>
            <TextInput label="Email" placeholder="cth: nama@sekolah.id" value={email} onChange={(e) => setEmail(e.target.value)} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Kirim tautan</Button>
          </form>
        )}
        {err && <Alert color="red" mt="md">{err}</Alert>}
        <Anchor component={Link} to="/login" mt="md" display="block">Kembali ke halaman masuk</Anchor>
      </Paper>
    </Container>
  );
}
