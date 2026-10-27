import { useState } from 'react';
import {
  Alert, Anchor, Box, Button, Container, Group, Paper, PasswordInput, SimpleGrid, Text, TextInput, Title,
} from '@mantine/core';
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
    <Container size={980} px="md" py="lg" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
      <Paper withBorder radius="lg" shadow="sm" w="100%" style={{ overflow: 'hidden' }}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
          {/* Panel merek: di ponsel menumpuk di atas form, di layar lebar jadi kolom kiri. */}
          <Box
            p={{ base: 'md', sm: 36 }}
            display="flex"
            style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(160deg, var(--primer) 0%, var(--sisi) 100%)',
              color: '#fff',
            }}
          >
            <div>
              <Group gap="sm" wrap="nowrap" align="center" mb={{ base: 24, sm: 40 }}>
                <img src="/sigeso-mark.svg" alt="" style={{ width: 'clamp(48px, 13vw, 66px)', height: 'auto' }} />
                <div>
                  <Text fw={800} fz={{ base: 32, sm: 42 }} lh={1} lts={2} style={{ color: '#fff' }}>SIGESO</Text>
                  <Text fz={{ base: 10, sm: 11 }} lts={2.5} mt={7} style={{ color: 'rgb(255 255 255 / 0.65)' }}>
                    SISTEM GENERATOR SOAL
                  </Text>
                </div>
              </Group>
              <Text fw={800} fz={{ base: 24, sm: 30 }} lh={1.2} mb="md" style={{ color: '#fff' }}>
                Dari materi ke lembar soal.
              </Text>
              <Text size="sm" lh={1.7} style={{ color: 'rgb(255 255 255 / 0.85)' }}>
                Pilih kelas dan topik, lalu Sigeso menyusun soal beserta kunci jawabannya.
                Anda cukup memeriksa, menyetujui, dan mencetak.
              </Text>
            </div>
            <Text size="xs" mt={{ base: 24, sm: 40 }} style={{ color: 'rgb(255 255 255 / 0.65)' }}>
              © {new Date().getFullYear()} Sigeso
            </Text>
          </Box>

          <Box p={{ base: 'lg', sm: 36 }}>
            <Title order={3} mb={4}>Masuk ke akun Anda</Title>
            <Text size="sm" c="dimmed" mb="lg">Gunakan email sekolah dan kata sandi Anda.</Text>
            <form onSubmit={submit}>
              <TextInput label="Email" placeholder="cth: nama@sekolah.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} mb="sm" />
              <PasswordInput label="Kata sandi" placeholder="Ketik kata sandi" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} mb="md" />
              <Button type="submit" fullWidth loading={loading}>Masuk</Button>
            </form>
            {msg && <Alert color="red" mt="md">{msg}</Alert>}
            <Group justify="space-between" mt="md" gap="xs" wrap="wrap">
              <Anchor component={Link} to="/lupa-sandi" size="sm">Lupa kata sandi?</Anchor>
              <Anchor component={Link} to="/register" size="sm">Belum punya akun? Daftar</Anchor>
            </Group>
          </Box>
        </SimpleGrid>
      </Paper>
    </Container>
  );
}
