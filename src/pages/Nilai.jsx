import { useEffect, useState } from 'react';
import { Alert, Badge, Button, FileInput, Group, NumberInput, Paper, Select, Table, Text, TextInput, Title } from '@mantine/core';
import api, { unduhBerkas } from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

export default function Nilai() {
  const [ujian, setUjian] = useState([]);
  const [exam, setExam] = useState('');
  const [daftar, setDaftar] = useState([]);
  const [qr, setQr] = useState('');
  const [files, setFiles] = useState([]);
  const [skor, setSkor] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function muat(id) {
    if (!id) return;
    try {
      const r = await api.get(`/submissions?exam_id=${id}`);
      setDaftar(r.data.data);
      const awal = {};
      r.data.data.forEach((s) => { awal[s.id] = s.final_score ?? ''; });
      setSkor(awal);
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => {
    api.get('/exams').then((r) => {
      setUjian(r.data.data);
      if (r.data.data[0]) { setExam(String(r.data.data[0].id)); muat(r.data.data[0].id); }
    }).catch(() => { /* pesan sudah muncul dari api.js */ });
  }, []);

  async function unggah() {
    if (!files.length || !qr) { setMsg('Isi QR dan pilih foto dulu.'); return; }
    setMsg('');
    setLoading(true);
    try {
      const fd = new FormData();
      [...files].slice(0, 5).forEach((f) => fd.append('foto', f));
      fd.append('qr_code', qr);
      const r = await api.post('/submissions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Ujian ditentukan oleh QR di kertas, bukan oleh pilihan di layar ini.
      const ke = String(r.data.data.exam_id || exam);
      setExam(ke);
      muat(ke);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function koreksi(id) {
    setLoading(true);
    try {
      await api.patch(`/submissions/${id}/review`, { final_score: Number(skor[id]) });
      muat(exam);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function ekspor(format) {
    setLoading(true);
    try {
      const r = await api.get(`/exams/${exam}/export?format=${format}`);
      await unduhBerkas(r.data.data.download);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }
  async function kunci(id) {
    setLoading(true);
    try {
      await api.post(`/submissions/${id}/finalize`, {});
      muat(exam);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  const final = daftar.filter((s) => s.status === 'final');
  const rata = final.length ? Math.round(final.reduce((a, s) => a + Number(s.final_score || 0), 0) / final.length) : '-';
  const belumDisimpan = (s) => String(skor[s.id] ?? '') !== String(s.final_score ?? '');

  return (
    <div>
      <Title order={2} mb="sm">Nilai</Title>
      <Panduan id="nilai" steps={['Lihat kode QR di kertas anak, ketik di kolom QR.', 'Pilih foto kertasnya (bisa lebih dari 1), tekan Unggah & nilai.', 'Periksa nilainya, ubah kalau salah, lalu tekan Simpan dan Kunci.']} />
      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Unggah foto jawaban</Title>
        {msg && <Alert color="orange" mb="sm">{msg}</Alert>}
        <Select
          label="Tampilkan nilai ujian"
          data={ujian.map((u) => ({ value: String(u.id), label: u.title }))}
          value={exam}
          onChange={(v) => { setExam(v || ''); muat(v); }}
          allowDeselect={false}
          maw={420}
          mb="sm"
        />
        <Group grow align="flex-end">
          <TextInput label="Kode QR dari kertas" placeholder="cth: SGxxx:p1" value={qr} onChange={(e) => setQr(e.target.value)} />
          <FileInput label="Foto lembar jawaban (bisa pilih lebih dari 1)" accept=".jpg,.jpeg,.png,.webp" multiple value={files} onChange={setFiles} />
        </Group>
        <Button onClick={unggah} loading={loading} mt="sm">Unggah & nilai</Button>
      </Paper>
      <Paper withBorder shadow="xs" p="md">
        <Title order={3} mb="xs">Review nilai</Title>
        <Group mb="sm">
          <Button variant="outline" onClick={() => ekspor('xlsx')} loading={loading}>Excel</Button>
          <Button variant="outline" onClick={() => ekspor('pdf')} loading={loading}>PDF</Button>
          <Button variant="outline" onClick={() => ekspor('docx')} loading={loading}>Word</Button>
        </Group>
        <Group mb="sm">
          <Badge color="teal" size="lg">Rata-rata: {rata}</Badge>
          <Badge color="green" size="lg">Terkunci: {final.length}</Badge>
          <Badge color="yellow" size="lg">Review: {daftar.length - final.length}</Badge>
        </Group>
        {daftar.length === 0 ? <Kosong teks="Belum ada nilai. Unggah foto jawaban di atas." /> : (
        <Table striped highlightOnHover>
          <Table.Thead><Table.Tr><Table.Th>Siswa</Table.Th><Table.Th>PG</Table.Th><Table.Th>Final</Table.Th><Table.Th>Status</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{daftar.map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>{s.name}</Table.Td><Table.Td>{s.pg_score}</Table.Td>
              <Table.Td>
                <NumberInput min={0} max={100} value={skor[s.id] ?? ''} onChange={(v) => setSkor({ ...skor, [s.id]: v })} style={{ width: 90 }} />
                {s.essay_suggested != null && <Text size="xs" c="dimmed">saran AI: {s.essay_suggested}</Text>}
              </Table.Td>
              <Table.Td>
                <Badge color={s.status === 'final' ? 'green' : 'yellow'}>{s.status === 'final' ? 'Terkunci' : 'Review'}</Badge>
                {s.status !== 'final' && belumDisimpan(s) && <Text size="xs" c="orange">belum disimpan</Text>}
              </Table.Td>
              <Table.Td>
                {s.status !== 'final' && <Group gap="xs"><Button size="xs" variant={belumDisimpan(s) ? 'filled' : 'outline'} onClick={() => koreksi(s.id)}>Simpan</Button><Button size="xs" onClick={() => kunci(s.id)}>Kunci</Button></Group>}
              </Table.Td>
            </Table.Tr>
          ))}</Table.Tbody>
        </Table>
        )}
      </Paper>
    </div>
  );
}
