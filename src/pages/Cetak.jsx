import { useEffect, useState } from 'react';
import { Button, Group, Paper, Select, Table, Title } from '@mantine/core';
import api, { unduhBerkas } from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

export default function Cetak() {
  const [ujian, setUjian] = useState([]);
  const [aktif, setAktif] = useState('');
  const [lembar, setLembar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.get('/exams').then((r) => { setUjian(r.data.data); if (r.data.data[0]) setAktif(String(r.data.data[0].id)); })
      .catch(() => { /* pesan sudah muncul dari api.js */ });
  }, []);
  async function muatLembar(id) {
    try {
      const r = await api.get(`/exams/${id}/sheets`);
      setLembar(r.data.data);
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => { if (aktif) muatLembar(aktif); }, [aktif]);

  async function cetak() {
    setLoading(true);
    try {
      const r = await api.post(`/exams/${aktif}/print`, {});
      await unduhBerkas(r.data.data.download);
      muatLembar(aktif);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function cetakUlang(id) {
    setLoading(true);
    try {
      const r = await api.post(`/sheets/${id}/reprint`, {});
      await unduhBerkas(r.data.data.download);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function dokumenSoal(format) {
    setLoading(true);
    try {
      const r = await api.get(`/exams/${aktif}/dokumen?format=${format}&isi=${modal.isi}`);
      await unduhBerkas(r.data.data.download);
      setModal(null);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  return (
    <div>
      <Title order={2} mb="sm">Cetak</Title>
      <Panduan id="cetak" steps={['Pilih ujian.', 'Tekan Cetak semua siswa, berkas otomatis terunduh untuk difotokopi.', 'Kalau ada kertas rusak, tekan Cetak ulang pada nama anak itu.']} />
      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Cetak lembar (satu-lembar ber-QR per siswa)</Title>
        <Group grow align="flex-end">
          <Select label="Pilih ujian" data={ujian.map((u) => ({ value: String(u.id), label: `${u.title} (${u.n_soal} soal)` }))} value={aktif} onChange={setAktif} />
        </Group>
        <Group mt="sm">
          <Button onClick={cetak} loading={loading} disabled={!aktif}>Cetak semua siswa</Button>
          <Button variant="outline" onClick={() => setModal({ isi: 'soal', judul: 'Download Soal' })} disabled={!aktif}>Download Soal</Button>
          <Button variant="outline" onClick={() => setModal({ isi: 'kunci', judul: 'Download Kunci Jawaban' })} disabled={!aktif}>Download Kunci Jawaban</Button>
        </Group>
        {lembar.length === 0 ? <Kosong teks="Belum ada lembar. Pilih ujian lalu tekan Cetak semua siswa." /> : (
        <Table striped highlightOnHover mt="sm">
          <Table.Thead><Table.Tr><Table.Th>Siswa</Table.Th><Table.Th>NIS</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{lembar.map((l) => <Table.Tr key={l.id}><Table.Td>{l.name}</Table.Td><Table.Td>{l.nis}</Table.Td><Table.Td><Button size="xs" variant="outline" onClick={() => cetakUlang(l.id)}>Cetak ulang</Button></Table.Td></Table.Tr>)}</Table.Tbody>
        </Table>
        )}
      </Paper>
      {modal && (
        <Modal judul={modal.judul} tutup={() => setModal(null)}>
          <p>Pilih Format</p>
          <Button fullWidth loading={loading} onClick={() => dokumenSoal('pdf')} mb="sm">PDF</Button>
          <Button fullWidth loading={loading} onClick={() => dokumenSoal('docx')} mb="sm">DOC</Button>
          <Button variant="outline" fullWidth onClick={() => setModal(null)}>Batal</Button>
        </Modal>
      )}
    </div>
  );
}
