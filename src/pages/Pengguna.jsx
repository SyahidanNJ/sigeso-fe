import { useEffect, useState } from 'react';
import { Badge, Button, Group, Paper, PasswordInput, Select, Switch, Table, TextInput, Title } from '@mantine/core';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

const PERAN = { superadmin: 'Super Admin', admin: 'Admin', guru: 'Guru' };
const awalBaru = { name: '', email: '', password: '', role: 'guru' };

export default function Pengguna() {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baru, setBaru] = useState(null);
  const [ubah, setUbah] = useState(null);
  const [sandi, setSandi] = useState(null);
  const [sandiBaru, setSandiBaru] = useState('');
  const [errSandi, setErrSandi] = useState('');

  async function muat() {
    try {
      const r = await api.get('/users');
      setDaftar(r.data.data);
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => { muat(); }, []);

  async function simpanBaru(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', { name: baru.name, email: baru.email, password: baru.password, role: baru.role });
      setBaru(null);
      muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function simpanUbah(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/users/${ubah.id}`, { name: ubah.name, role: ubah.role, is_active: ubah.is_active });
      setUbah(null);
      muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function simpanSandi(e) {
    e.preventDefault();
    if (sandiBaru.length < 6) return setErrSandi('Kata sandi baru minimal 6 huruf.');
    setLoading(true);
    try {
      await api.put(`/users/${sandi.id}/password`, { password: sandiBaru });
      setSandi(null);
      setSandiBaru('');
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  return (
    <div>
      <Panduan id="pengguna" steps={['Tambah akun untuk guru yang perlu masuk ke Sigeso.', 'Beri tahu email dan kata sandi awalnya; guru bisa menggantinya sendiri di halaman Profil.', 'Nonaktifkan akun yang sudah tidak dipakai supaya tidak bisa masuk lagi.']} />
      <Paper withBorder shadow="xs" p="md">
        <Group justify="space-between" mb="sm">
          <Title order={3}>Pengguna ({daftar.length})</Title>
          <Button onClick={() => setBaru({ ...awalBaru })}>Tambah Pengguna</Button>
        </Group>
        {daftar.length === 0 ? <Kosong teks="Belum ada pengguna lain di sekolah ini." /> : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>No</Table.Th><Table.Th>Nama</Table.Th><Table.Th>Email</Table.Th><Table.Th>Peran</Table.Th><Table.Th>Status</Table.Th><Table.Th style={{ textAlign: 'right' }}>Aksi</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{daftar.map((u, i) => (
              <Table.Tr key={u.id}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>{PERAN[u.role] || u.role}</Table.Td>
                <Table.Td><Badge color={u.is_active ? 'teal' : 'gray'} variant="light">{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge></Table.Td>
                <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {u.role === 'superadmin' ? <Badge variant="light" color="gray">Tak bisa diubah</Badge> : (
                    <>
                      <Button variant="outline" size="xs" onClick={() => setUbah({ id: u.id, name: u.name, role: u.role, is_active: u.is_active })}>Ubah</Button>{' '}
                      <Button variant="outline" size="xs" onClick={() => { setSandi(u); setSandiBaru(''); setErrSandi(''); }}>Atur sandi</Button>
                    </>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}</Table.Tbody>
          </Table>
        )}
      </Paper>

      {baru && (
        <Modal judul="Tambah Pengguna" tutup={() => setBaru(null)}>
          <form onSubmit={simpanBaru}>
            <TextInput label="Nama" placeholder="cth: Ibu Siti" value={baru.name} onChange={(e) => setBaru({ ...baru, name: e.target.value })} mb="sm" />
            <TextInput label="Email" placeholder="cth: nama@sekolah.id" value={baru.email} onChange={(e) => setBaru({ ...baru, email: e.target.value })} mb="sm" />
            <PasswordInput label="Kata sandi awal" placeholder="Minimal 6 huruf" value={baru.password} onChange={(e) => setBaru({ ...baru, password: e.target.value })} mb="sm" />
            <Select label="Peran" data={[{ value: 'guru', label: 'Guru' }, { value: 'admin', label: 'Admin' }]} value={baru.role} onChange={(v) => setBaru({ ...baru, role: v })} allowDeselect={false} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}

      {ubah && (
        <Modal judul="Ubah Pengguna" tutup={() => setUbah(null)}>
          <form onSubmit={simpanUbah}>
            <TextInput label="Nama" value={ubah.name} onChange={(e) => setUbah({ ...ubah, name: e.target.value })} mb="sm" />
            <Select label="Peran" data={[{ value: 'guru', label: 'Guru' }, { value: 'admin', label: 'Admin' }]} value={ubah.role} onChange={(v) => setUbah({ ...ubah, role: v })} allowDeselect={false} mb="sm" />
            <Switch label="Akun aktif (bisa masuk)" checked={ubah.is_active} onChange={(e) => setUbah({ ...ubah, is_active: e.currentTarget.checked })} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}

      {sandi && (
        <Modal judul={`Atur sandi — ${sandi.name}`} tutup={() => setSandi(null)}>
          <form onSubmit={simpanSandi}>
            <p style={{ color: '#64748b', marginTop: 0 }}>Buat kata sandi baru, lalu berikan kepada guru tersebut. Dia bisa menggantinya sendiri di halaman Profil.</p>
            <PasswordInput label="Kata sandi baru" placeholder="Minimal 6 huruf" value={sandiBaru} onChange={(e) => { setSandiBaru(e.target.value); setErrSandi(''); }} error={errSandi} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
