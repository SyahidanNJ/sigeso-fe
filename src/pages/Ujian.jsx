import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Badge, Button, Checkbox, CloseButton, Group, NumberInput, Paper, Select, SimpleGrid, Table, Text, Textarea, TextInput, Title,
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
// Tiga jenis soal dihitung sendiri-sendiri; boleh dikosongkan (mis. tanpa uraian).
const KOLOM_JUMLAH = [
  { kunci: 'pg', label: 'Pilihan ganda' },
  { kunci: 'isian', label: 'Isian' },
  { kunci: 'uraian', label: 'Uraian' },
];
const barisAwal = () => [{ name: '', pg: 5, isian: '', uraian: '' }];

// Satu kartu soal dipakai di dua tempat: di dalam modal setelah Generate dan di
// panel "Buka" pada daftar ujian. Di modal, persetujuan dipilih lewat centang
// lalu disimpan sekali; di panel, tombol Setuju langsung menyimpan.
function KartuSoal({ it, onSetuju, onUbah, onHapus, dicentang, onCentang }) {
  const pakaiCentang = typeof dicentang === 'boolean';
  return (
    <Paper withBorder p="sm" mb="xs">
      <Group justify="space-between" gap="xs" mb={6} wrap="wrap">
        <Group gap="xs">
          <Badge variant="light" color="gray">No {it.nomor}</Badge>
          <Text size="sm" c="dimmed">{NAMA_JENIS[it.qtype] || it.qtype}</Text>
        </Group>
        {pakaiCentang ? (
          <Checkbox
            aria-label="Setujui soal"
            checked={dicentang}
            onChange={(e) => onCentang(it, e.currentTarget.checked)}
          />
        ) : (
          <>
            <Button size="xs" variant={it.approved ? 'subtle' : 'filled'} onClick={() => onSetuju(it)}>
              {it.approved ? 'Batalkan' : 'Setuju'}
            </Button>
            <Badge color={it.approved ? 'teal' : 'gray'} variant="light">
              {it.approved ? 'Disetujui' : 'Belum'}
            </Badge>
          </>
        )}
      </Group>
      <Text size="sm" mb={4}>{it.text}</Text>
      {it.qtype === 'PG' && (it.options || []).length > 0 && (
        <Text size="xs" c="dimmed" mb={4}>{(it.options || []).join(' · ')}</Text>
      )}
      <Text size="sm" mb="xs"><b>Kunci:</b> {it.answer_key}</Text>
      <Group gap={6} wrap="wrap" justify="space-between">
        <Group gap={6} wrap="wrap">
          <Button size="xs" variant="outline" onClick={() => onUbah(it)}>Ubah</Button>
          <Button size="xs" variant="outline" color="red" onClick={() => onHapus(it)}>Hapus</Button>
        </Group>
      </Group>
    </Paper>
  );
}

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
  const [cariUjian, setCariUjian] = useState('');
  const [aktif, setAktif] = useState(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hapus, setHapus] = useState(null);
  const [ubah, setUbah] = useState(null);
  const [formBuka, setFormBuka] = useState(false);
  // Centang soal di modal; baru dikirim ke server saat Simpan ditekan.
  const [pilih, setPilih] = useState(() => new Set());

  // Form buat ujian dibuka dalam kondisi bersih supaya isian lama tidak terbawa.
  function bukaForm() {
    setAktif(null);
    setItems([]);
    setPilih(new Set());
    setErrors([]);
    setMsg('');
    setBaris(barisAwal());
    setForm((f) => ({ ...f, mapel: '' }));
    setFormBuka(true);
  }

  // Simpan = tutup modal dan kembali ke daftar ujian. Persetujuan soal sudah
  // tersimpan tiap kali tombolnya ditekan, jadi tidak ada yang perlu dikirim lagi.
  function tutupForm() {
    setFormBuka(false);
    setAktif(null);
    setItems([]);
    setPilih(new Set());
    setErrors([]);
  }

  // Hanya soal yang statusnya berbeda dari centang yang dikirim, supaya tidak
  // mengubah apa pun kalau guru tidak mengubah pilihan.
  async function simpanPilihan() {
    const berubah = items.filter((i) => pilih.has(i.id) !== i.approved);
    if (!berubah.length) { tutupForm(); return; }
    setLoading(true);
    try {
      await Promise.all(berubah.map((i) => api.put(`/exams/${aktif.id}/items/${i.id}`, { approved: pilih.has(i.id) }, { silent: true })));
      await muatUjian();
      tutupForm();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  function centang(it, nilai) {
    setPilih((p) => {
      const baru = new Set(p);
      if (nilai) baru.add(it.id); else baru.delete(it.id);
      return baru;
    });
  }

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
    setFormBuka(true);
    try {
      const data = (await api.get(`/exams/${u.id}/items`)).data.data;
      setItems(data);
      setPilih(new Set(data.filter((i) => i.approved).map((i) => i.id)));
    } catch { setItems([]); setPilih(new Set()); }
  }

  async function generate(e) {
    e.preventDefault();
    setMsg(''); setErrors([]);
    if (!kelasId) { setMsg('Pilih kelasnya dulu.'); return; }
    if (!form.mapel.trim()) { setMsg('Mapel belum diisi.'); return; }
    const isi = baris.filter((b) => b.name.trim());
    if (!isi.length) { setMsg('Isi minimal satu topik.'); return; }
    const jumlah = (v) => Number(v) || 0;
    if (isi.some((b) => jumlah(b.pg) + jumlah(b.isian) + jumlah(b.uraian) < 1)) {
      setMsg('Isi jumlah soal untuk minimal satu jenis di setiap topik.');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/generate', {
        class_id: Number(kelasId),
        exam_type: form.exam_type,
        subject_name: form.mapel.trim(),
        paper_size: form.paper_size,
        topics: isi.map((b) => ({
          name: b.name.trim(),
          pg: jumlah(b.pg),
          isian: jumlah(b.isian),
          uraian: jumlah(b.uraian),
        })),
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

  // Nama file unduhan memakai judul ujian (disanitasi) supaya mudah dikenali.
  function namaFileCetak(u, kunci) {
    const bersih = String(u.title || 'ujian')
      .replace(/[<>:"/\\|?*]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `${kunci ? 'Kunci' : 'Soal'} - ${bersih}.pdf`;
  }

  async function cetak(u, kunci) {
    setLoading(true);
    try {
      const r = await api.post(`/exams/${u.id}/${kunci ? 'answer-key' : 'print'}`);
      await unduhBerkas(r.data.data.download, namaFileCetak(u, kunci));
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

  // Pencarian di daftar ujian cukup di layar: satu sekolah hanya punya puluhan ujian.
  const kataUjian = cariUjian.trim().toLowerCase();
  const ujianTampil = kataUjian
    ? ujian.filter((u) => `${u.title} ${u.mapel || ''} ${u.kelas || ''} ${u.tingkat || ''}`.toLowerCase().includes(kataUjian))
    : ujian;
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

      {formBuka && (
      <Modal judul={aktif ? 'Periksa soal' : 'Buat ujian'} tutup={tutupForm} lebar={880}>
        {aktif ? (
          <div>
            <Title order={3} mb="xs">{aktif.title}</Title>
            <Group justify="space-between" align="center" mb="xs" wrap="wrap" gap="xs">
              <Badge color="teal">{pilih.size} dari {items.length} disetujui</Badge>
              <Group gap="xs">
                <Button size="xs" variant="outline" onClick={() => setPilih(new Set(items.map((i) => i.id)))} disabled={!items.length}>
                  Setuju semua
                </Button>
                <Button size="xs" onClick={simpanPilihan} loading={loading}>Simpan</Button>
              </Group>
            </Group>
            <Text size="sm" c="dimmed" mb="sm">
              Centang soal yang Anda setujui, lalu tekan Simpan. Hanya soal yang disetujui yang dihitung dan dicetak.
            </Text>
            {errors.length > 0 && (
              <Alert color="orange" mb="sm" title="Sebagian topik gagal dibuat">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {errors.map((e, i) => <li key={i}><b>{e.topik}</b>: {e.pesan}</li>)}
                </ul>
              </Alert>
            )}
            {items.length === 0 ? <Kosong teks="Ujian ini belum punya soal." /> : items.map((it) => (
              <KartuSoal
                key={it.id}
                it={it}
                dicentang={pilih.has(it.id)}
                onCentang={centang}
                onUbah={(x) => setUbah({ ...x, opsiTeks: (x.options || []).join('\n') })}
                onHapus={(x) => { setPilih((p) => { const n = new Set(p); n.delete(x.id); return n; }); hapusItem(x); }}
              />
            ))}
            <Button fullWidth mt="sm" onClick={simpanPilihan} loading={loading}>Simpan</Button>
          </div>
        ) : (
        <>
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
              rightSection={form.mapel ? (
                <CloseButton aria-label="Kosongkan mapel" onClick={() => { setForm({ ...form, mapel: '' }); setBaris(barisAwal()); }} />
              ) : null}
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
              {KOLOM_JUMLAH.map((k) => (
                <NumberInput
                  key={k.kunci}
                  label={i === 0 ? k.label : undefined}
                  min={0}
                  max={20}
                  maw={110}
                  placeholder="0"
                  value={b[k.kunci]}
                  onChange={(v) => gantiBaris(i, { [k.kunci]: v })}
                  disabled={!kelasSiap}
                />
              ))}
              {baris.length > 1 && (
                <Button
                  variant="subtle"
                  color="red"
                  mb={2}
                  onClick={() => setBaris((x) => x.filter((_, j) => j !== i))}
                >
                  Hapus
                </Button>
              )}
            </Group>
          ))}
          <Group mt="sm" justify="space-between">
            <Button variant="outline" size="xs" onClick={() => setBaris((b) => [...b, { ...barisAwal()[0], name: '' }])} disabled={!kelasSiap}>
              + Tambah topik
            </Button>
            <Group gap="xs">
              <Button variant="default" onClick={tutupForm}>Batal</Button>
              <Button type="submit" loading={loading} disabled={!kelasSiap}>
                {loading ? 'Membuat soal…' : 'Generate'}
              </Button>
            </Group>
          </Group>
        </form>

        {errors.length > 0 && (
          <Alert color="orange" mt="md" title="Sebagian topik gagal dibuat">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((e, i) => <li key={i}><b>{e.topik}</b>: {e.pesan}</li>)}
            </ul>
          </Alert>
        )}
        </>
        )}
      </Modal>
      )}

      <Paper withBorder shadow="xs" p="md" mb="md">
        <Group justify="space-between" align="flex-end" mb="xs" wrap="wrap" gap="xs">
          <Title order={3}>Daftar ujian</Title>
          <Group gap="xs" wrap="wrap">
            <TextInput
              size="sm"
              placeholder="Cari judul, mapel, atau kelas"
              value={cariUjian}
              onChange={(e) => setCariUjian(e.currentTarget.value)}
              maw={300}
              autoComplete="off"
              rightSection={cariUjian ? <CloseButton aria-label="Kosongkan pencarian" onClick={() => setCariUjian('')} /> : null}
            />
            <Button size="sm" onClick={bukaForm} disabled={!kelasSiap}>+ Buat ujian</Button>
          </Group>
        </Group>
        {ujian.length === 0 ? <Kosong teks="Belum ada ujian. Buat lewat tombol Buat ujian." /> : ujianTampil.length === 0 ? (
          <Kosong teks={`Tidak ada ujian yang memuat "${cariUjian.trim()}".`} />
        ) : (
          <Table.ScrollContainer minWidth={980}>
          <Table striped highlightOnHover layout="fixed">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Judul</Table.Th>
                <Table.Th w={160}>Mapel</Table.Th>
                <Table.Th w={110}>Kelas</Table.Th>
                <Table.Th w={70}>Soal</Table.Th>
                <Table.Th w={100}>Disetujui</Table.Th>
                <Table.Th w={330}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ujianTampil.map((u) => (
                <Table.Tr key={u.id} style={aktif?.id === u.id ? { background: 'var(--mantine-color-teal-0)' } : null}>
                  <Table.Td>{u.title}</Table.Td>
                  <Table.Td>{u.mapel || '-'}</Table.Td>
                  <Table.Td>{u.kelas || '-'}</Table.Td>
                  <Table.Td>{u.n_soal}</Table.Td>
                  <Table.Td>{u.n_setuju}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Group gap={6} wrap="wrap" justify="flex-end">
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
