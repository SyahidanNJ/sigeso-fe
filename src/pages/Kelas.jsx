import { useEffect, useState } from 'react';
import { Button, FileInput, Group, Paper, Select, Table, TextInput, Title } from '@mantine/core';
import api from '../lib/api';
import { JENJANG, labelJenjang, opsiKelas } from '../lib/jenjang';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

const awalKelas = { name: 'Kelas 7', academic_year: '2026/2027', jenjang: 'SMP', level: 7 };
const awalSiswa = { name: '', nis: '' };

export default function Kelas() {
  const [kelas, setKelas] = useState([]);
  const [aktif, setAktif] = useState(null);
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mKelas, setMKelas] = useState(null);
  const [mSiswa, setMSiswa] = useState(null);
  const [hapus, setHapus] = useState(null);
  const [impor, setImpor] = useState(null);
  const [berkas, setBerkas] = useState(null);

  async function muatKelas(pilihId) {
    try {
      const r = await api.get('/classes');
      setKelas(r.data.data);
      const tuju = r.data.data.find((k) => k.id === (pilihId || aktif?.id)) || r.data.data[0];
      setAktif(tuju || null);
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => { muatKelas(); }, []);
  useEffect(() => {
    if (!aktif) { setSiswa([]); return; }
    api.get(`/students?class_id=${aktif.id}`).then((r) => setSiswa(r.data.data)).catch(() => { /* pesan sudah muncul dari api.js */ });
  }, [aktif]);

  function pilihJenjang(v) {
    const j = JENJANG.find((x) => x.value === v);
    setMKelas((m) => ({ ...m, jenjang: v, level: j.mulai, name: `Kelas ${j.mulai}` }));
  }
  function pilihLevel(v) {
    setMKelas((m) => ({ ...m, level: Number(v), name: `Kelas ${v}` }));
  }

  async function simpanKelas(e) {
    e.preventDefault();
    setLoading(true);
    const isi = { name: mKelas.name, academic_year: mKelas.academic_year, jenjang: mKelas.jenjang, level: Number(mKelas.level) };
    try {
      if (mKelas.id) await api.put(`/classes/${mKelas.id}`, isi);
      else await api.post('/classes', isi);
      setMKelas(null);
      muatKelas(mKelas.id);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function simpanSiswa(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mSiswa.id) await api.put(`/students/${mSiswa.id}`, { name: mSiswa.name, nis: mSiswa.nis });
      else await api.post('/students', { class_id: aktif.id, name: mSiswa.name, nis: mSiswa.nis });
      setMSiswa(null);
      const s = await api.get(`/students?class_id=${aktif.id}`);
      setSiswa(s.data.data);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function imporExcel(e) {
    e.preventDefault();
    if (!berkas) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', berkas);
      fd.append('class_id', aktif.id);
      await api.post('/students/import-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImpor(null);
      setBerkas(null);
      const s = await api.get(`/students?class_id=${aktif.id}`);
      setSiswa(s.data.data);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function jalankanHapus() {
    setLoading(true);
    try {
      if (hapus.jenis === 'kelas') {
        await api.delete(`/classes/${hapus.id}`);
        setHapus(null);
        setAktif(null);
        muatKelas();
      } else {
        await api.delete(`/students/${hapus.id}`);
        setHapus(null);
        const s = await api.get(`/students?class_id=${aktif.id}`);
        setSiswa(s.data.data);
      }
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  return (
    <div>
      <Panduan id="kelas" steps={['Tekan tombol nama kelas untuk memilihnya.', 'Tekan Tambah Siswa untuk menambah anak satu per satu, atau Impor Excel untuk memasukkan satu kelas sekaligus.', 'Pastikan nama anak sudah muncul di tabel.']} />
      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Kelas ({kelas.length})</Title>
        <Group mb="sm">
          {kelas.map((k) => <Button key={k.id} variant={aktif?.id === k.id ? 'filled' : 'light'} onClick={() => setAktif(k)}>{k.name}</Button>)}
        </Group>
        {kelas.length === 0 && <Kosong teks="Belum ada kelas. Buat dulu lewat tombol di bawah." />}
        <Group mt="sm">
          <Button onClick={() => setMKelas({ ...awalKelas })}>Tambah Kelas</Button>
          <Button variant="outline" onClick={() => aktif && setMKelas({ ...aktif })} disabled={!aktif}>Edit</Button>
          <Button variant="outline" onClick={() => aktif && setHapus({ jenis: 'kelas', id: aktif.id, nama: aktif.name })} disabled={!aktif}>Hapus</Button>
        </Group>
      </Paper>
      {aktif && (
        <Paper withBorder shadow="xs" p="md">
          <Title order={3} mb="xs">Siswa ({labelJenjang(aktif.jenjang)}) — {aktif.name} ({siswa.length} anak)</Title>
          {siswa.length === 0 ? <Kosong teks="Belum ada siswa di kelas ini. Tekan Tambah Siswa." /> : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>No</Table.Th><Table.Th>Nama</Table.Th><Table.Th>NIS</Table.Th><Table.Th style={{ textAlign: 'right' }}>Aksi</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{siswa.map((s, i) => (
              <Table.Tr key={s.id}>
                <Table.Td>{i + 1}</Table.Td><Table.Td>{s.name}</Table.Td><Table.Td>{s.nis}</Table.Td>
                <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Button variant="outline" size="xs" onClick={() => setMSiswa({ ...s })}>Edit</Button>{' '}
                  <Button variant="outline" size="xs" onClick={() => setHapus({ jenis: 'siswa', id: s.id, nama: s.name })}>Hapus</Button>
                </Table.Td>
              </Table.Tr>
            ))}</Table.Tbody>
          </Table>
          )}
          <Button onClick={() => setMSiswa({ ...awalSiswa })} mt="sm">Tambah Siswa</Button>{' '}
          <Button variant="outline" onClick={() => setImpor(true)} mt="sm">Impor Excel</Button>
        </Paper>
      )}
      {mKelas && (
        <Modal judul={mKelas.id ? 'Ubah Kelas' : 'Tambah Kelas'} tutup={() => setMKelas(null)}>
          <form onSubmit={simpanKelas}>
            <Select label="Jenjang sekolah" data={JENJANG.map((j) => ({ value: j.value, label: j.label }))} value={mKelas.jenjang} onChange={pilihJenjang} allowDeselect={false} mb="sm" />
            <Select label="Kelas" data={opsiKelas(mKelas.jenjang)} value={String(mKelas.level)} onChange={pilihLevel} allowDeselect={false} mb="sm" />
            <TextInput label="Nama kelas" placeholder="cth: Kelas 7A" value={mKelas.name} onChange={(e) => setMKelas({ ...mKelas, name: e.target.value })} mb="sm" />
            <TextInput label="Tahun ajaran" placeholder="cth: 2026/2027" value={mKelas.academic_year} onChange={(e) => setMKelas({ ...mKelas, academic_year: e.target.value })} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}
      {mSiswa && (
        <Modal judul={mSiswa.id ? 'Ubah Siswa' : 'Tambah Siswa'} tutup={() => setMSiswa(null)}>
          <form onSubmit={simpanSiswa}>
            <TextInput label="Nama anak" placeholder="cth: Budi" value={mSiswa.name} onChange={(e) => setMSiswa({ ...mSiswa, name: e.target.value })} mb="sm" />
            <TextInput label="NIS" placeholder="cth: 1001" value={mSiswa.nis} onChange={(e) => setMSiswa({ ...mSiswa, nis: e.target.value })} mb="md" />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}
      {impor && (
        <Modal judul="Impor siswa dari Excel" tutup={() => { setImpor(null); setBerkas(null); }}>
          <form onSubmit={imporExcel}>
            <p style={{ color: '#64748b', marginTop: 0 }}>
              Siapkan berkas <b>.xlsx</b> dengan kolom <b>Nama</b> dan <b>NIS</b>. Baris pertama boleh berisi judul kolom.
              NIS yang sudah ada di kelas ini hanya diperbarui namanya, jadi impor aman diulang.
            </p>
            <FileInput label="Berkas .xlsx" accept=".xlsx" value={berkas} onChange={setBerkas} mb="md" />
            <Button type="submit" fullWidth loading={loading} disabled={!berkas}>Impor ke {aktif.name}</Button>
          </form>
        </Modal>
      )}
      {hapus && (
        <Modal judul="Hapus?" tutup={() => setHapus(null)}>
          <p>Yakin hapus {hapus.jenis} <b>{hapus.nama}</b>?{hapus.jenis === 'kelas' ? ' Kelas berisi siswa tidak bisa dihapus.' : ' Nilainya tetap tersimpan.'}</p>
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapus} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapus(null)}>Batal</Button>
        </Modal>
      )}
    </div>
  );
}
