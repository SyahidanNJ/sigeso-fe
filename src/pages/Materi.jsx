import { useEffect, useState } from 'react';
import { Alert, Button, FileInput, Group, Paper, Table, Text, TextInput, Title } from '@mantine/core';
import api, { unduhBerkas } from '../lib/api';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

const STATUS = { done: 'Siap dipakai', pending: 'Sedang dibaca', failed: 'Gagal dibaca' };

// Sumber materi untuk subbab yang dipilih di bar atas (PemilihSubbab).
export default function Materi({ subBab }) {
  const [sumber, setSumber] = useState([]);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hapus, setHapus] = useState(null);

  async function muatSumber() {
    if (!subBab) { setSumber([]); return; }
    try {
      const r = await api.get('/sources', { params: { sub_chapter_id: subBab.id } });
      setSumber(r.data.data);
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => { muatSumber(); }, [subBab?.id]);

  async function unggah() {
    if (!file) { setMsg('Pilih berkasnya dulu.'); return; }
    setMsg('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sub_chapter_id', subBab.id);
      await api.post('/sources/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      muatSumber();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function tambahUrl() {
    if (!url) { setMsg('Isi URL dulu.'); return; }
    setMsg('');
    setLoading(true);
    try {
      await api.post('/sources/url', { url, sub_chapter_id: Number(subBab.id) });
      setUrl('');
      muatSumber();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  // Tautan dibuka langsung; berkas lewat rute ber-token supaya tidak 401.
  async function buka(s) {
    if (s.original_url) { window.open(s.original_url, '_blank', 'noopener'); return; }
    try { await unduhBerkas(`/sources/${s.id}/file`, s.nama); } catch { /* pesan sudah muncul dari api.js */ }
  }

  async function jalankanHapus() {
    setLoading(true);
    try {
      await api.delete(`/sources/${hapus.id}`);
      setHapus(null);
      muatSumber();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  if (!subBab) {
    return (
      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Sumber materi</Title>
        <Kosong teks="Pilih Subbab di bar atas — tempat unggah materi muncul di sini." />
      </Paper>
    );
  }

  return (
    <Paper withBorder shadow="xs" p="md" mb="md">
      <Title order={3} mb="xs">Sumber materi — {subBab.nama}</Title>
      {msg && <Alert color="orange" mb="sm">{msg}</Alert>}
      {sumber.length === 0 ? <Kosong teks="Belum ada materi di subbab ini. Unggah berkas atau tempel link di bawah." /> : (
        <Table striped highlightOnHover mb="sm">
          <Table.Thead><Table.Tr><Table.Th w={90}>Jenis</Table.Th><Table.Th>Sumber</Table.Th><Table.Th w={160}>Status</Table.Th><Table.Th w={160}>Aksi</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{sumber.map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>{s.kind === 'url' ? 'Link' : 'Berkas'}</Table.Td>
              <Table.Td>{s.original_url || s.nama || '-'}</Table.Td>
              <Table.Td>
                <Text size="sm">{STATUS[s.status] || s.status}</Text>
                {s.status === 'failed' && s.error && <Text size="xs" c="red">{s.error}</Text>}
              </Table.Td>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Button size="compact-xs" variant="outline" onClick={() => buka(s)}>{s.kind === 'url' ? 'Buka' : 'Unduh'}</Button>
                  <Button size="compact-xs" variant="outline" color="red" onClick={() => setHapus(s)}>Hapus</Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}</Table.Tbody>
        </Table>
      )}
      <Group align="flex-end">
        <FileInput label="Berkas materi (PDF, DOCX, atau TXT)" accept=".pdf,.docx,.txt" value={file} onChange={setFile} style={{ flex: 1 }} />
        <Button onClick={unggah} loading={loading}>Unggah</Button>
      </Group>
      <Group align="flex-end" mt="sm">
        <TextInput label="Link materi (diawali https://)" placeholder="cth: https://belajar.id/materi/..." value={url} onChange={(e) => setUrl(e.target.value)} style={{ flex: 1 }} />
        <Button onClick={tambahUrl} loading={loading}>+ URL</Button>
      </Group>
      {hapus && (
        <Modal judul="Hapus materi?" tutup={() => setHapus(null)}>
          <p>Yakin hapus <b>{hapus.nama || hapus.original_url}</b>?</p>
          <p style={{ color: '#64748b' }}>Berkasnya ikut dibuang dari server. Kalau materi ini sudah dipakai membuat soal, penghapusan akan ditolak.</p>
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapus} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapus(null)}>Batal</Button>
        </Modal>
      )}
    </Paper>
  );
}
