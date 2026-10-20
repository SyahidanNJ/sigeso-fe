import { useEffect, useState } from 'react';
import { Alert, Button, Group, NumberInput, Paper, Select, Table, Text, Textarea, TextInput, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import api from '../lib/api';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

const JENIS_SOAL = [
  { qtype: 'PG', label: 'Pilihan ganda' },
  { qtype: 'ISIAN', label: 'Isian singkat' },
  { qtype: 'URAIAN', label: 'Uraian' },
];
const NAMA_JENIS = Object.fromEntries(JENIS_SOAL.map((j) => [j.qtype, j.label]));
const BATAS = 200; // samakan dengan LIMIT di listQuestions

export default function BankSoal({ subBab }) {
  const [daftar, setDaftar] = useState([]);
  const [adaLagi, setAdaLagi] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [gen, setGen] = useState({ count: 3 });
  const [hapus, setHapus] = useState(null);
  const [ubah, setUbah] = useState(null);
  const [cari, setCari] = useState('');
  // Satu ketikan tidak memicu request; baru setelah berhenti 300 ms.
  const kata = useDebouncedValue(cari.trim(), 300);

  // Daftar hanya berisi soal subbab terpilih, supaya tak tercampur mapel lain.
  // beforeId memuat halaman berikutnya ke arah soal lama lalu menyambungnya.
  async function muat(beforeId) {
    try {
      const params = { ...(subBab ? { sub_chapter_id: subBab.id } : {}), ...(kata ? { q: kata } : {}), ...(beforeId ? { before_id: beforeId } : {}) };
      const r = await api.get('/questions', Object.keys(params).length ? { params } : undefined);
      setDaftar((d) => (beforeId ? [...d, ...r.data.data] : r.data.data));
      setAdaLagi(r.data.data.length === BATAS);
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => { muat(); }, [subBab?.id, kata]);

  async function generate(e) {
    e.preventDefault();
    if (!subBab) { setMsg('Pilih subbabnya dulu di bar atas.'); return; }
    setMsg('');
    setLoading(true);
    try {
      await api.post('/generate', { count: Number(gen.count), sub_chapter_id: subBab.id, qtypes: ['PG', 'ISIAN', 'URAIAN'] });
      muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function jalankanHapus() {
    setLoading(true);
    try {
      await api.delete(`/questions/${hapus.id}`);
      setHapus(null);
      muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function simpanUbah(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const isi = { text: ubah.text, answer_key: ubah.answer_key, rubric: ubah.rubrik || undefined };
      if (ubah.qtype === 'PG') isi.options = ubah.opsiTeks.split('\n').map((s) => s.trim()).filter(Boolean);
      await api.put(`/questions/${ubah.id}`, isi);
      setUbah(null);
      muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  // Huruf kunci mengikuti jumlah baris pilihan.
  const hurufOpsi = ubah && ubah.qtype === 'PG'
    ? ubah.opsiTeks.split('\n').filter((s) => s.trim()).map((_, i) => String.fromCharCode(65 + i))
    : [];

  return (
    <div>
      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Generate soal (AI)</Title>
        {msg && <Alert color="orange" mb="sm">{msg}</Alert>}
        <form onSubmit={generate}>
          <NumberInput label="Jumlah soal (1–20)" min={1} max={20} maw={200} value={gen.count} onChange={(v) => setGen({ ...gen, count: v })} />
          <Text size="sm" mt="xs" c={subBab ? 'dimmed' : 'orange'}>
            {subBab ? <>Subbab terpilih: <b>{subBab.nama}</b></> : 'Pilih subbab dulu di bar atas.'}
          </Text>
          <Button type="submit" loading={loading} disabled={!subBab} mt="sm">{loading ? 'Membuat... (±30 dtk)' : 'Generate'}</Button>
        </form>
      </Paper>
      <Paper withBorder shadow="xs" p="md">
        <Title order={3} mb="xs">Bank soal{subBab ? ` — ${subBab.nama}` : ' (semua subbab)'} ({daftar.length})</Title>
        <TextInput
          label="Cari soal"
          placeholder="cth: pecahan senilai"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          mb="md"
          maw={420}
          description={kata && kata !== cari.trim() ? 'Mencari…' : undefined}
        />
        {daftar.length === 0 ? <Kosong teks={kata ? `Tidak ada soal yang memuat "${kata}".` : subBab ? 'Belum ada soal di subbab ini. Buat lewat Generate di atas.' : 'Bank masih kosong. Pilih subbab di bar atas, lalu buat lewat Generate di atas.'} /> : JENIS_SOAL.map(({ qtype, label }) => {
          const isi = daftar.filter((q) => q.qtype === qtype).sort((a, b) => a.id - b.id);
          return (
            <div key={qtype}>
              <Title order={4} mt="lg" mb="xs">{label} ({isi.length})</Title>
              {isi.length === 0 ? <Text size="sm" c="dimmed">Belum ada soal {label.toLowerCase()}.</Text> : (
                <Table layout="fixed" striped highlightOnHover>
                  <Table.Thead><Table.Tr><Table.Th w={56}>No</Table.Th><Table.Th>Soal</Table.Th><Table.Th w={240}>Kunci</Table.Th><Table.Th w={150}>Aksi</Table.Th></Table.Tr></Table.Thead>
                  <Table.Tbody>{isi.map((q, i) => (
                    <Table.Tr key={q.id}>
                      <Table.Td>{i + 1}</Table.Td><Table.Td>{q.text.slice(0, 80)}</Table.Td><Table.Td>{q.answer_key}</Table.Td>
                      <Table.Td>
                        <Button variant="outline" size="xs" onClick={() => setUbah({ ...q, opsiTeks: (q.options || []).join('\n') })}>Ubah</Button>{' '}
                        <Button variant="outline" color="red" size="xs" onClick={() => setHapus(q)}>Hapus</Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}</Table.Tbody>
                </Table>
              )}
            </div>
          );
        })}
        {adaLagi && (
          <Group mt="md" gap="sm">
            <Button variant="outline" onClick={() => muat(daftar[daftar.length - 1].id)} loading={loading}>Muat 200 soal sebelumnya</Button>
            <Text size="sm" c="dimmed">Menampilkan {daftar.length} soal terbaru saja.</Text>
          </Group>
        )}
      </Paper>
      {ubah && (
        <Modal judul={`Ubah soal ${NAMA_JENIS[ubah.qtype]}`} tutup={() => setUbah(null)}>
          <form onSubmit={simpanUbah}>
            <Textarea label="Soal" autosize minRows={3} value={ubah.text} onChange={(e) => setUbah({ ...ubah, text: e.target.value })} mb="sm" />
            {ubah.qtype === 'PG' ? (
              <>
                <Textarea label="Pilihan jawaban (satu per baris, contoh: A. Jakarta)" autosize minRows={4} value={ubah.opsiTeks} onChange={(e) => setUbah({ ...ubah, opsiTeks: e.target.value })} mb="sm" />
                <Select label="Kunci jawaban" data={hurufOpsi} value={ubah.answer_key} onChange={(v) => setUbah({ ...ubah, answer_key: v || '' })} allowDeselect={false} mb="sm" />
              </>
            ) : (
              <TextInput label="Kunci jawaban" value={ubah.answer_key} onChange={(e) => setUbah({ ...ubah, answer_key: e.target.value })} mb="sm" />
            )}
            {ubah.qtype === 'URAIAN' && (
              <Textarea label="Rubrik penilaian (opsional)" autosize minRows={2} value={ubah.rubrik || ''} onChange={(e) => setUbah({ ...ubah, rubrik: e.target.value })} mb="sm" />
            )}
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}
      {hapus && (
        <Modal judul="Hapus soal?" tutup={() => setHapus(null)}>
          <p>Yakin hapus soal <b>{hapus.text.slice(0, 80)}</b>?</p>
          <p style={{ color: '#64748b' }}>Kalau soal ini sedang dipakai di sebuah ujian, penghapusan akan ditolak.</p>
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapus} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapus(null)}>Batal</Button>
        </Modal>
      )}
    </div>
  );
}
