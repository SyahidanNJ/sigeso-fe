import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Paper, PasswordInput, Select, Text, TextInput, Title } from '@mantine/core';
import api from '../lib/api';
import { JENJANG, opsiKelas, TAHUN_AJARAN, TAHUN_AJARAN_KINI } from '../lib/jenjang';

const PERAN = { superadmin: 'Super Admin', admin: 'Admin', guru: 'Guru' };
const AWAL = { lama: '', baru: '', ulang: '' };
const LABEL = { color: '#64748b', display: 'inline-block', width: 90 };
// Nama kelas mengikuti tingkat selama guru belum mengetik nama sendiri.
const namaTingkat = (level) => (level ? `Kelas ${level}` : '');
const namaOtomatis = (k) => !k.name.trim() || k.name === namaTingkat(k.level);
const KELAS_BARU = { jenjang: 'SD', level: '4', name: namaTingkat('4'), academic_year: TAHUN_AJARAN_KINI };

export default function Profil() {
  const [user, setUser] = useState(null);
  const [kelas, setKelas] = useState([]);
  const [pilihKelas, setPilihKelas] = useState('');
  const [form, setForm] = useState(AWAL);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [bukaNama, setBukaNama] = useState(false);
  const [nama, setNama] = useState('');
  const [simpanNama, setSimpanNama] = useState(false);
  const [msgNama, setMsgNama] = useState('');
  const [bukaKelas, setBukaKelas] = useState(false);
  const [kelasBaru, setKelasBaru] = useState(KELAS_BARU);
  const [msgKelas, setMsgKelas] = useState('');
  const [simpanKelas, setSimpanKelas] = useState(false);
  const [hapusKelas, setHapusKelas] = useState(null);
  const [loadingHapus, setLoadingHapus] = useState(false);

  function pasangUser(u) {
    setUser(u);
    setPilihKelas(u?.default_class_id ? String(u.default_class_id) : '');
  }

  async function muatKelas() {
    try { setKelas((await api.get('/classes')).data.data); } catch { /* pesan sudah muncul dari api.js */ }
  }

  useEffect(() => {
    api.get('/auth/me').then((r) => pasangUser(r.data.data)).catch(() => { /* pesan sudah muncul dari api.js */ });
    muatKelas();
  }, []);

  async function simpanKelasSaya(e) {
    e.preventDefault();
    if (!pilihKelas) { setMsgKelas('Pilih kelasnya dulu.'); return; }
    setMsgKelas('');
    setLoading(true);
    try {
      const r = await api.put('/auth/profile', { default_class_id: Number(pilihKelas) });
      pasangUser(r.data.data);
      window.dispatchEvent(new Event('sigeso:user'));
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function tambahKelas(e) {
    e.preventDefault();
    if (!kelasBaru.level) { setMsgKelas('Pilih tingkatnya dulu.'); return; }
    if (!kelasBaru.academic_year.trim()) { setMsgKelas('Tahun ajaran belum dipilih.'); return; }
    setMsgKelas('');
    setSimpanKelas(true);
    try {
      const r = await api.post('/classes', {
        name: kelasBaru.name.trim() || namaTingkat(kelasBaru.level),
        academic_year: kelasBaru.academic_year.trim(),
        jenjang: kelasBaru.jenjang,
        level: Number(kelasBaru.level),
      });
      await muatKelas();
      setPilihKelas(String(r.data.data.id));
      setBukaKelas(false);
      setKelasBaru(KELAS_BARU);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setSimpanKelas(false); }
  }

  async function hapusKelasTerpilih() {
    setLoadingHapus(true);
    try {
      await api.delete(`/classes/${hapusKelas.id}`);
      setHapusKelas(null);
      await muatKelas();
      // Kelas yang dihapus bisa jadi kelas default guru, jadi profil dimuat ulang.
      api.get('/auth/me').then((r) => pasangUser(r.data.data)).catch(() => { /* pesan sudah muncul dari api.js */ });
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoadingHapus(false); }
  }

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
      pasangUser(r.data.data);
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
        <Title order={3} mb="sm">Kelas saya</Title>
        <Text size="sm" mb="sm" c="dimmed">
          {user?.class_name
            ? `Sekarang: ${user.class_name}${user.level ? ` · tingkat ${user.level}` : ''}${user.academic_year ? ` · ${user.academic_year}` : ''}`
            : 'Belum ada kelas. Pilih salah satu di bawah atau buat kelas baru.'}
        </Text>
        {msgKelas && <Alert color="orange" mb="sm">{msgKelas}</Alert>}
        <form onSubmit={simpanKelasSaya}>
          <Select
            label="Kelas"
            placeholder={kelas.length ? '— pilih kelas —' : 'sekolah belum punya kelas'}
            data={kelas.map((k) => ({ value: String(k.id), label: `${k.name} (${k.academic_year})` }))}
            value={pilihKelas}
            onChange={(v) => setPilihKelas(v || '')}
            allowDeselect={false}
            renderOption={({ option }) => (
              <Group justify="space-between" gap="xs" wrap="nowrap" w="100%">
                <Text size="sm" truncate>{option.label}</Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHapusKelas(kelas.find((k) => String(k.id) === option.value));
                  }}
                >
                  Hapus
                </Button>
              </Group>
            )}
            mb="sm"
          />
          <Group>
            <Button type="submit" loading={loading} disabled={!pilihKelas}>Simpan kelas</Button>
            <Button variant="outline" onClick={() => { setMsgKelas(''); setKelasBaru(KELAS_BARU); setBukaKelas(true); }}>+ Tambah kelas baru</Button>
          </Group>
        </form>
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

      <Modal opened={Boolean(hapusKelas)} onClose={() => setHapusKelas(null)} title="Hapus kelas?" centered>
        <Text size="sm">
          <b>{hapusKelas?.name}</b> ({hapusKelas?.academic_year}) akan dihapus permanen.
          Ujian yang memakai kelas ini harus dipindah atau dihapus dulu.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setHapusKelas(null)}>Batal</Button>
          <Button color="red" loading={loadingHapus} onClick={hapusKelasTerpilih}>Hapus</Button>
        </Group>
      </Modal>

      <Modal opened={bukaKelas} onClose={() => setBukaKelas(false)} title="Tambah kelas baru" centered>
        <form onSubmit={tambahKelas}>
          {msgKelas && <Alert color="orange" mb="sm">{msgKelas}</Alert>}
          <Select
            label="Jenjang"
            data={JENJANG.map((j) => ({ value: j.value, label: j.label }))}
            value={kelasBaru.jenjang}
            onChange={(v) => setKelasBaru((k) => ({
              ...k, jenjang: v || 'SD', level: '',
              name: namaOtomatis(k) ? '' : k.name,
            }))}
            allowDeselect={false}
            mb="sm"
          />
          <Select
            label="Tingkat"
            data={opsiKelas(kelasBaru.jenjang)}
            value={kelasBaru.level}
            onChange={(v) => setKelasBaru((k) => ({
              ...k, level: v || '',
              name: namaOtomatis(k) ? namaTingkat(v) : k.name,
            }))}
            allowDeselect={false}
            mb="sm"
          />
          <TextInput
            label="Nama kelas"
            placeholder={kelasBaru.level ? namaTingkat(kelasBaru.level) : 'cth: Kelas 4A'}
            value={kelasBaru.name}
            onChange={(e) => setKelasBaru({ ...kelasBaru, name: e.target.value })}
            mb="sm"
          />
          <Select
            label="Tahun ajaran"
            data={TAHUN_AJARAN}
            value={kelasBaru.academic_year}
            onChange={(v) => setKelasBaru({ ...kelasBaru, academic_year: v || '' })}
            allowDeselect={false}
            mb="md"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setBukaKelas(false)}>Batal</Button>
            <Button type="submit" loading={simpanKelas} disabled={!kelasBaru.level}>Simpan kelas</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}
