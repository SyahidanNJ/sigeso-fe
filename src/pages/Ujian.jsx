import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Badge, Button, Group, NumberInput, Paper, Select, SimpleGrid, Table, Text, Textarea, TextInput, Title,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import api, { unduhBerkas } from '../lib/api';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

// Jenis ujian tercetak sebagai judul lembar.
const JENIS_UJIAN = [
  'Ulangan Harian',
  'Penilaian Tengah Semester (PTS)',
  'Penilaian Akhir Semester (PAS)',
  'Penilaian Akhir Tahun (PAT)',
  'Asesmen Sumatif Tengah Semester (ASTS)',
  'Asesmen Sumatif Akhir Semester (ASAS)',
  'Asesmen Sumatif Akhir Tahun (ASAT)',
  'Ujian Sekolah (US)',
  'Penilaian Ujian Satuan Pendidikan (USP)',
  'Try Out',
];
const NAMA_JENIS = { PG: 'Pilihan ganda', ISIAN: 'Isian', URAIAN: 'Uraian' };
const barisAwal = () => [{ name: '', count: 5 }];

export default function Ujian() {
  const nav = useNavigate();
  const [profil, setProfil] = useState(null);
  const [kelasList, setKelasList] = useState([]);
  const [kelasId, setKelasId] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [topikList, setTopikList] = useState([]);
  const [form, setForm] = useState({ mapel: '', exam_type: 'Ulangan Harian', paper_size: 'A4' });
  const [baris, setBaris] = useState(barisAwal);
  const [ujian, setUjian] = useState([]);
  const [aktif, setAktif] = useState(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hapus, setHapus] = useState(null);
  const [ubah, setUbah] = useState(null);

  async function muatUjian() {
    setUjian((await api.get('/exams')).data.data);
  }

  // Kelas dan mapel dimuat sekali. Mapel sengaja diambil semua tingkat sekolah
  // supaya pilihannya lengkap; yang menentukan isi soal tetap kelas yang dipilih.
  useEffect(() => {
    (async () => {
      try {
        const [p, k, s] = await Promise.all([api.get('/auth/me'), api.get('/classes'), api.get('/subjects')]);
        const daftar = k.data.data;
        setProfil(p.data.data);
        setKelasList(daftar);
        setMapelList(s.data.data);
        const awal = p.data.data.default_class_id || daftar[0]?.id;
        setKelasId(awal ? String(awal) : '');
        await muatUjian();
      } catch { /* pesan sudah muncul dari api.js */ }
    })();
  }, []);

  // Tingkat dipakai untuk mencocokkan mapel dan topik milik kelas yang dipilih.
  const level = kelasList.find((k) => String(k.id) === kelasId)?.level || null;

  // Mapel diketik bebas; kalau namanya cocok dengan mapel tingkat ini, topiknya dimuat.
  const mapelId = mapelList.find(
    (m) => m.name.toLowerCase() === form.mapel.trim().toLowerCase() && m.grade_level === level
  )?.id || null;
  useEffect(() => {
    if (!mapelId) { setTopikList([]); return; }
    api.get('/topics', { params: { subject_id: mapelId } })
      .then((r) => setTopikList(r.data.data))
      .catch(() => { /* pesan sudah muncul dari api.js */ });
  }, [mapelId]);

  function gantiBaris(i, patch) {
    setBaris((b) => b.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  async function bukaUjian(u) {
    setAktif(u);
    try { setItems((await api.get(`/exams/${u.id}/items`)).data.data); } catch { setItems([]); }
  }

  async function generate(e) {
    e.preventDefault();
    setMsg(''); setErrors([]);
    if (!kelasId) { setMsg('Pilih kelasnya dulu.'); return; }
    if (!form.mapel.trim()) { setMsg('Mapel belum diisi.'); return; }
    const isi = baris.filter((b) => b.name.trim());
    if (!isi.length) { setMsg('Isi minimal satu topik.'); return; }
    setLoading(true);
    try {
      const r = await api.post('/generate', {
        class_id: Number(kelasId),
        exam_type: form.exam_type,
        subject_name: form.mapel.trim(),
        paper_size: form.paper_size,
        topics: isi.map((b) => ({ name: b.name.trim(), count: Number(b.count) || 1 })),
      });
      const hasil = r.data.data;
      setErrors(hasil.errors || []);
      await muatUjian();
      // Semua topik gagal: ujian kosongnya sudah dibuang server, jangan dibuka.
      if (hasil.items?.length) await bukaUjian(hasil.exam);
    } catch (e) {
      // Server menolak dengan daftar error per topik; toast sudah menampilkan ringkasannya.
      setErrors(e.response?.data?.details || []);
    } finally { setLoading(false); }
  }

  // Menyetujui atau membatalkan persetujuan satu soal.
  async function setujui(it) {
    try {
      await api.put(`/exams/${aktif.id}/items/${it.id}`, { approved: !it.approved }, { silent: true });
      const r = await api.get(`/exams/${aktif.id}/items`);
      setItems(r.data.data);
      await muatUjian();
    } catch { /* pesan sudah muncul dari api.js */ }
  }

  // Menyetujui semua sekaligus. Yang sudah disetujui tidak dikirim ulang supaya
  // tidak berbalik jadi "Batalkan"; umpan baliknya badge "x dari y disetujui".
  async function setujuiSemua() {
    const belum = items.filter((i) => !i.approved);
    if (!belum.length) return;
    setLoading(true);
    try {
      await Promise.all(belum.map((i) => api.put(`/exams/${aktif.id}/items/${i.id}`, { approved: true }, { silent: true })));
      const r = await api.get(`/exams/${aktif.id}/items`);
      setItems(r.data.data);
      await muatUjian();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function hapusItem(it) {
    try {
      await api.delete(`/exams/${aktif.id}/items/${it.id}`, { silent: true });
      const r = await api.get(`/exams/${aktif.id}/items`);
      setItems(r.data.data);
      await muatUjian();
    } catch { /* pesan sudah muncul dari api.js */ }
  }

  async function simpanUbah(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const isi = { text: ubah.text, answer_key: ubah.answer_key, rubric: ubah.rubric || null };
      if (ubah.qtype === 'PG') isi.options = ubah.opsiTeks.split('\n').map((s) => s.trim()).filter(Boolean);
      await api.put(`/exams/${aktif.id}/items/${ubah.id}`, isi);
      setUbah(null);
      const r = await api.get(`/exams/${aktif.id}/items`);
      setItems(r.data.data);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function cetak(u, kunci) {
    setLoading(true);
    try {
      const r = await api.post(`/exams/${u.id}/${kunci ? 'answer-key' : 'print'}`);
      await unduhBerkas(r.data.data.download, `${kunci ? 'kunci' : 'soal'}-ujian-${u.id}.pdf`);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function jalankanHapus() {
    setLoading(true);
    try {
      await api.delete(`/exams/${hapus.id}`);
      if (aktif?.id === hapus.id) { setAktif(null); setItems([]); }
      setHapus(null);
      await muatUjian();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  const jumlahSetuju = items.filter((i) => i.approved).length;
  const hurufOpsi = ubah && ubah.qtype === 'PG'
    ? ubah.opsiTeks.split('\n').filter((s) => s.trim()).map((_, i) => String.fromCharCode(65 + i))
    : [];
  const kelasSiap = Boolean(kelasId);

  return (
    <div>
      <Title order={2} mb="sm">Ujian</Title>

      {profil && !kelasList.length && (
        <Alert color="orange" mb="md" title="Belum ada kelas">
          Buat kelas dulu di Profil (jenjang, tingkat, tahun ajaran), lalu pilih di sini.
          <Group mt="sm">
            <Button size="xs" onClick={() => nav('/profil')}>Buka Profil</Button>
          </Group>
        </Alert>
      )}

      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Buat ujian</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Mapel bisa dipilih dari daftar atau diketik baru. Mapel baru tersimpan otomatis saat Generate.
        </Text>
        <form onSubmit={generate}>
          {msg && <Alert color="orange" mb="sm">{msg}</Alert>}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="sm">
            <Select
              label="Kelas"
              placeholder={kelasList.length ? '— pilih kelas —' : 'belum ada kelas'}
              data={kelasList.map((k) => ({ value: String(k.id), label: `${k.name} (${k.academic_year})` }))}
              value={kelasId}
              onChange={(v) => setKelasId(v || '')}
              allowDeselect={false}
            />
            <Autocomplete
              label="Mapel"
              placeholder="pilih atau ketik mapel baru"
              data={[...new Set(mapelList.map((m) => m.name))]}
              value={form.mapel}
              onChange={(v) => { setForm({ ...form, mapel: v }); setBaris(barisAwal()); }}
              disabled={!kelasSiap}
            />
            <Select
              label="Jenis ujian"
              data={JENIS_UJIAN}
              value={form.exam_type}
              onChange={(v) => setForm({ ...form, exam_type: v || 'Ulangan Harian' })}
              allowDeselect={false}
            />
            <Select
              label="Ukuran kertas"
              data={['A4', 'F4']}
              value={form.paper_size}
              onChange={(v) => setForm({ ...form, paper_size: v || 'A4' })}
              allowDeselect={false}
            />
          </SimpleGrid>

          {baris.map((b, i) => (
            <Group key={i} align="flex-end" mb="xs" gap="xs" wrap="wrap">
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <Autocomplete
                  label={i === 0 ? 'Topik' : undefined}
                  placeholder="pilih atau ketik topik baru"
                  data={topikList.map((t) => t.name)}
                  value={b.name}
                  onChange={(v) => gantiBaris(i, { name: v })}
                  disabled={!kelasSiap}
                />
              </div>
              <NumberInput
                label={i === 0 ? 'Jumlah soal' : undefined}
                min={1}
                max={20}
                maw={140}
                value={b.count}
                onChange={(v) => gantiBaris(i, { count: v })}
                disabled={!kelasSiap}
              />
              <Button
                variant="subtle"
                color="red"
                mb={2}
                onClick={() => setBaris((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : x))}
                disabled={baris.length === 1}
              >
                Hapus
              </Button>
            </Group>
          ))}
          <Group mt="sm">
            <Button variant="outline" size="xs" onClick={() => setBaris((b) => [...b, { name: '', count: 5 }])} disabled={!kelasSiap}>
              + Tambah topik
            </Button>
            <Button type="submit" loading={loading} disabled={!kelasSiap}>
              {loading ? 'Membuat soal…' : 'Generate'}
            </Button>
          </Group>
        </form>

        {errors.length > 0 && (
          <Alert color="orange" mt="md" title="Sebagian topik gagal dibuat">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((e, i) => <li key={i}><b>{e.topik}</b>: {e.pesan}</li>)}
            </ul>
          </Alert>
        )}
      </Paper>

      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Daftar ujian</Title>
        {ujian.length === 0 ? <Kosong teks="Belum ada ujian. Buat di atas." /> : (
          <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Judul</Table.Th><Table.Th>Mapel</Table.Th><Table.Th>Kelas</Table.Th>
                <Table.Th>Soal</Table.Th><Table.Th>Disetujui</Table.Th><Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ujian.map((u) => (
                <Table.Tr key={u.id} style={aktif?.id === u.id ? { background: 'var(--mantine-color-teal-0)' } : null}>
                  <Table.Td>{u.title}</Table.Td>
                  <Table.Td>{u.mapel || '-'}</Table.Td>
                  <Table.Td>{u.kelas || '-'}</Table.Td>
                  <Table.Td>{u.n_soal}</Table.Td>
                  <Table.Td>{u.n_setuju}</Table.Td>
                  <Table.Td>
                    <Group gap={6} wrap="wrap">
                      <Button size="xs" onClick={() => bukaUjian(u)}>Buka</Button>
                      <Button size="xs" variant="outline" onClick={() => cetak(u, false)} disabled={!u.n_setuju}>Cetak soal</Button>
                      <Button size="xs" variant="outline" onClick={() => cetak(u, true)} disabled={!u.n_setuju}>Kunci</Button>
                      <Button size="xs" variant="outline" color="red" onClick={() => setHapus(u)}>Hapus</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {aktif && (
        <Paper withBorder shadow="xs" p="md">
          <Group justify="space-between" align="center" mb="xs">
            <Title order={3}>{aktif.title}</Title>
            <Group gap="xs">
              <Badge color="teal">{jumlahSetuju} dari {items.length} disetujui</Badge>
              <Button size="xs" onClick={setujuiSemua} loading={loading} disabled={!items.length || jumlahSetuju === items.length}>
                Setuju semua
              </Button>
            </Group>
          </Group>
          <Text size="sm" c="dimmed" mb="sm">
            Hanya soal yang disetujui yang dihitung dan dicetak. Ubah teks/kunci lewat tombol Ubah.
          </Text>
          {items.length === 0 ? <Kosong teks="Ujian ini belum punya soal." /> : items.map((it) => (
            <Paper key={it.id} withBorder p="sm" mb="xs">
              <Group justify="space-between" gap="xs" mb={6} wrap="wrap">
                <Group gap="xs">
                  <Badge variant="light" color="gray">No {it.nomor}</Badge>
                  <Text size="sm" c="dimmed">{NAMA_JENIS[it.qtype] || it.qtype}</Text>
                </Group>
                <Badge color={it.approved ? 'teal' : 'gray'} variant="light">
                  {it.approved ? 'Disetujui' : 'Belum'}
                </Badge>
              </Group>
              <Text size="sm" mb={4}>{it.text}</Text>
              {it.qtype === 'PG' && (it.options || []).length > 0 && (
                <Text size="xs" c="dimmed" mb={4}>{(it.options || []).join(' · ')}</Text>
              )}
              <Text size="sm" mb="xs"><b>Kunci:</b> {it.answer_key}</Text>
              <Group gap={6} wrap="wrap">
                <Button size="xs" variant={it.approved ? 'subtle' : 'filled'} onClick={() => setujui(it)}>
                  {it.approved ? 'Batalkan' : 'Setuju'}
                </Button>
                <Button size="xs" variant="outline" onClick={() => setUbah({ ...it, opsiTeks: (it.options || []).join('\n') })}>Ubah</Button>
                <Button size="xs" variant="outline" color="red" onClick={() => hapusItem(it)}>Hapus</Button>
              </Group>
            </Paper>
          ))}
        </Paper>
      )}

      {ubah && (
        <Modal judul={`Ubah soal ${NAMA_JENIS[ubah.qtype] || ''}`} tutup={() => setUbah(null)}>
          <form onSubmit={simpanUbah}>
            <Textarea label="Soal" autosize minRows={3} value={ubah.text} onChange={(e) => setUbah({ ...ubah, text: e.target.value })} mb="sm" />
            {ubah.qtype === 'PG' ? (
              <>
                <Textarea label="Pilihan jawaban (satu per baris)" autosize minRows={4} value={ubah.opsiTeks} onChange={(e) => setUbah({ ...ubah, opsiTeks: e.target.value })} mb="sm" />
                <Select label="Kunci jawaban" data={hurufOpsi} value={ubah.answer_key} onChange={(v) => setUbah({ ...ubah, answer_key: v || '' })} allowDeselect={false} mb="sm" />
              </>
            ) : (
              <TextInput label="Kunci jawaban" value={ubah.answer_key} onChange={(e) => setUbah({ ...ubah, answer_key: e.target.value })} mb="sm" />
            )}
            {ubah.qtype === 'URAIAN' && (
              <Textarea label="Rubrik penilaian (opsional)" autosize minRows={2} value={ubah.rubric || ''} onChange={(e) => setUbah({ ...ubah, rubric: e.target.value })} mb="sm" />
            )}
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}

      {hapus && (
        <Modal judul="Hapus ujian?" tutup={() => setHapus(null)}>
          <p>Yakin hapus ujian <b>{hapus.title}</b>?</p>
          <p style={{ color: '#64748b' }}>
            Soal tetap tersimpan di bank. Berkas cetak yang pernah dibuat ikut terhapus.
          </p>
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapus} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapus(null)}>Batal</Button>
        </Modal>
      )}
    </div>
  );
}
