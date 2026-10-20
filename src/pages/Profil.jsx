import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import api from '../lib/api';

const PERAN = { superadmin: 'Super Admin', admin: 'Admin', guru: 'Guru' };
const AWAL = { lama: '', baru: '', ulang: '' };
const LABEL = { color: '#64748b', display: 'inline-block', width: 90 };

export default function Profil() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(AWAL);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [bukaNama, setBukaNama] = useState(false);
  const [nama, setNama] = useState('');
  const [simpanNama, setSimpanNama] = useState(false);
  const [msgNama, setMsgNama] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data.data)).catch(() => { /* pesan sudah muncul dari api.js */ });
  }, []);

  function ubahNama() {
    setNama(user?.name || '');
    setMsgNama('');
    setBukaNama(true);
  }

  async function simpanNamaBaru(e) {
    e.preventDefault();
    if (!nama.trim()) { setMsgNama('Nama belum diisi.'); return; }
    setMsgNama('');
    setSimpanNama(true);
    try {
      const r = await api.put('/auth/profile', { name: nama.trim() });
      setUser((u) => ({ ...u, name: r.data.data.name }));
      setBukaNama(false);
      // Header memuat ulang profilnya supaya nama di pojok kanan ikut berganti.
      window.dispatchEvent(new Event('sigeso:user'));
    } catch { /* pesan sudah muncul dari api.js */ } finally { setSimpanNama(false); }
  }

  const gantiSandi = Boolean(form.lama || form.baru || form.ulang);

  async function simpanSandi(e) {
    e.preventDefault();
    if (!form.lama) { setMsg('Kata sandi sekarang belum diisi.'); return; }
    if (form.baru !== form.ulang) { setMsg('Kata sandi baru dan ulangannya belum sama.'); return; }
    if (form.baru.length < 6) { setMsg('Kata sandi baru minimal 6 huruf.'); return; }
    setMsg('');
    setLoading(true);
    try {
      await api.put('/auth/password', { lama: form.lama, baru: form.baru });
      setForm(AWAL);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  const baris = (label, isi) => (
    <Text size="sm" mb={6}><span style={LABEL}>{label}</span>{isi || '-'}</Text>
  );

  return (
    <div>
      <Title order={2} mb="sm">Profil</Title>
      <Paper withBorder shadow="xs" p="md" mb="md" maw={560}>
        <Title order={3} mb="sm">Akun</Title>
        <Group justify="space-between" wrap="nowrap" mb={6}>
          <Text size="sm"><span style={LABEL}>Nama</span>{user?.name || '-'}</Text>
          <Button size="xs" variant="light" onClick={ubahNama} disabled={!user}>Ubah</Button>
        </Group>
        {baris('Email', user?.email)}
        {baris('Peran', PERAN[user?.role] || user?.role)}
        {baris('Sekolah', user?.school)}
      </Paper>
      <Paper withBorder shadow="xs" p="md" mb="md" maw={560}>
        <Title order={3} mb="xs">Ganti kata sandi</Title>
        {msg && <Alert color="orange" mb="sm">{msg}</Alert>}
        <form onSubmit={simpanSandi}>
          <PasswordInput label="Kata sandi sekarang" value={form.lama} onChange={(e) => setForm({ ...form, lama: e.target.value })} mb="sm" />
          <PasswordInput label="Kata sandi baru (minimal 6 huruf)" value={form.baru} onChange={(e) => setForm({ ...form, baru: e.target.value })} mb="sm" />
          <PasswordInput label="Ulangi kata sandi baru" value={form.ulang} onChange={(e) => setForm({ ...form, ulang: e.target.value })} />
          <Button type="submit" mt="md" loading={loading} disabled={!gantiSandi}>Simpan</Button>
        </form>
      </Paper>

      <Modal opened={bukaNama} onClose={() => setBukaNama(false)} title="Ubah nama" centered>
        <form onSubmit={simpanNamaBaru}>
          {msgNama && <Alert color="orange" mb="sm">{msgNama}</Alert>}
          <TextInput label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} data-autofocus />
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => setBukaNama(false)}>Batal</Button>
            <Button type="submit" loading={simpanNama}>Simpan</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}
