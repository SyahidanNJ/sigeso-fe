import { useEffect, useState } from 'react';
import { Button, Container, Paper, PasswordInput, Select, TextInput, Title } from '@mantine/core';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor } from '@mantine/core';

export default function Register() {
  const nav = useNavigate();
  const [sekolah, setSekolah] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', institution_id: '', class_id: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/institutions').then((r) => {
      setSekolah(r.data.data);
      if (r.data.data[0]) setForm((f) => ({ ...f, institution_id: String(r.data.data[0].id) }));
    }).catch(() => {});
  }, []);

  // Kelas dimuat dari endpoint publik setelah sekolah dipilih.
  useEffect(() => {
    if (!form.institution_id) { setKelas([]); return; }
    api.get(`/auth/institutions/${form.institution_id}/classes`)
      .then((r) => setKelas(r.data.data))
      .catch(() => setKelas([]));
  }, [form.institution_id]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        institution_id: Number(form.institution_id),
        class_id: form.class_id ? Number(form.class_id) : undefined,
      });
      localStorage.setItem('sigeso_token', r.data.data.token);
      localStorage.setItem('sigeso_user', JSON.stringify(r.data.data.user));
      nav('/');
    } catch { /* pesan sudah muncul dari api.js */ } finally {
      setLoading(false);
    }
  }

  return (
    <Container size={380} my={60}>
      <Title ta="center" mb="md">Daftar akun guru</Title>
      <Paper withBorder shadow="xs" p="md">
        <form onSubmit={submit}>
          <TextInput label="Nama lengkap" placeholder="cth: Ibu Ani" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} mb="sm" />
          <TextInput label="Email" placeholder="cth: nama@sekolah.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} mb="sm" />
          <PasswordInput label="Kata sandi (minimal 6 huruf)" placeholder="Ketik kata sandi" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} mb="sm" />
          <Select
            label="Sekolah"
            data={sekolah.map((s) => ({ value: String(s.id), label: s.name }))}
            value={form.institution_id}
            onChange={(v) => setForm({ ...form, institution_id: v || '', class_id: '' })}
            mb="sm"
          />
          <Select
            label="Kelas"
            placeholder={kelas.length ? '— pilih kelas —' : 'boleh dikosongkan'}
            description="Boleh dikosongkan; atur nanti di halaman Profil."
            data={kelas.map((k) => ({ value: String(k.id), label: `${k.name} (${k.academic_year})` }))}
            value={form.class_id}
            onChange={(v) => setForm({ ...form, class_id: v || '' })}
            clearable
            mb="md"
          />
          <Button type="submit" fullWidth loading={loading}>Daftar</Button>
        </form>
        <Anchor component={Link} to="/login" mt="sm" display="block">Sudah punya akun? Masuk</Anchor>
      </Paper>
    </Container>
  );
}
