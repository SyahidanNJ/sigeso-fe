import { Fragment, useEffect, useState } from 'react';
import { Alert, Badge, Button, Checkbox, Group, Paper, Select, Table, Text, TextInput, Title } from '@mantine/core';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';
import Modal from '../components/Modal';

const BATAS = 200; // samakan dengan LIMIT di listQuestions
const MAKS = 100;  // batas question_ids di setExamItems
const KUNCI_SUBBAB = 'sigeso_subbab'; // sama dengan Soal.jsx

// Subbab yang sedang digarap di halaman Materi & Soal, dipakai sebagai saringan awal di sini.
function subBabTerpilih() {
  try { return JSON.parse(sessionStorage.getItem(KUNCI_SUBBAB))?.id || null; } catch { return null; }
}

export default function Ujian() {
  const [ujian, setUjian] = useState([]);
  const [bank, setBank] = useState([]);
  const [adaLagi, setAdaLagi] = useState(false);
  const [kelas, setKelas] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [aktif, setAktif] = useState(null);
  const [dipilih, setDipilih] = useState([]);
  const [form, setForm] = useState({ title: '', class_id: '', subject_id: '' });
  const [tipe, setTipe] = useState('SEMUA');
  const [materi, setMateri] = useState('semua');
  const [cari, setCari] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [ubahUjian, setUbahUjian] = useState(null);
  const [hapusUjian, setHapusUjian] = useState(null);

  async function muatBank(beforeId) {
    try {
      const b = await api.get('/questions', beforeId ? { params: { before_id: beforeId } } : undefined);
      setBank((d) => (beforeId ? [...d, ...b.data.data] : b.data.data));
      setAdaLagi(b.data.data.length === BATAS);
    } catch { /* pesan sudah muncul dari api.js */ }
  }

  async function muat() {
    try {
      const u = await api.get('/exams');
      setUjian(u.data.data);
      const k = await api.get('/classes');
      setKelas(k.data.data);
      const m = await api.get('/subjects');
      setMapelList(m.data.data);
      setForm((f) => (f.class_id || !k.data.data[0] ? f : { ...f, class_id: String(k.data.data[0].id) }));
    } catch { /* pesan sudah muncul dari api.js */ }
  }
  useEffect(() => { muat(); muatBank(); }, []);
  // Ganti mapel = mulai dari awal: daftar ujian & soal ikut mapel itu saja.
  useEffect(() => { setAktif(null); setDipilih([]); }, [form.subject_id]);

  // Saringan awal saat ujian dibuka: subbab soal ujian itu; kalau ujiannya masih kosong,
  // ikut subbab yang sedang digarap di halaman Materi & Soal.
  function saringanAwal(u, items) {
    const sub = items.find((q) => q.sub_chapter_id)?.sub_chapter_id || subBabTerpilih();
    if (sub && bank.some((q) => q.sub_chapter_id === sub && (!u.subject_id || q.subject_id === u.subject_id))) return `s:${sub}`;
    if (u.subject_id && bank.some((q) => q.subject_id === u.subject_id)) return `m:${u.subject_id}`;
    return 'semua';
  }

  async function pilihUjian(u) {
    setAktif(u);
    try {
      const it = await api.get(`/exams/${u.id}/items`);
      const ids = it.data.data.map((x) => x.id);
      setDipilih(ids);
      setMateri(saringanAwal(u, it.data.data));
    } catch { /* pesan sudah muncul dari api.js */ }
  }

  async function buat(e) {
    e.preventDefault();
    if (!form.subject_id) { setMsg('Pilih mapelnya dulu.'); return; }
    if (!form.class_id) { setMsg('Pilih kelas dulu. Kalau belum ada, buat di halaman Kelas & Siswa.'); return; }
    setMsg('');
    setLoading(true);
    try {
      const r = await api.post('/exams', { ...form, class_id: Number(form.class_id), subject_id: Number(form.subject_id) });
      await muat();
      pilihUjian(r.data.data); // langsung buka daftar soal supaya bisa ditempeli
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  const namaMapel = mapelList.find((m) => String(m.id) === form.subject_id)?.name || '';
  const daftarUjian = ujian.filter((u) => String(u.subject_id) === form.subject_id);

  function centang(id) {
    if (!dipilih.includes(id) && dipilih.length >= MAKS) { setMsg(`Maksimal ${MAKS} soal per ujian.`); return; }
    setMsg('');
    setDipilih(dipilih.includes(id) ? dipilih.filter((x) => x !== id) : [...dipilih, id]);
  }

  async function simpan() {
    setLoading(true);
    try {
      await api.put(`/exams/${aktif.id}/items`, { question_ids: dipilih });
      muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  async function simpanJudul(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/exams/${ubahUjian.id}`, { title: ubahUjian.title });
      setUbahUjian(null);
      await muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  // Hitung dulu lembar & nilainya supaya peringatan hapus menyebut angka nyata.
  async function bukaHapus(u) {
    try {
      const [s, sub] = await Promise.all([
        api.get(`/exams/${u.id}/sheets`),
        api.get('/submissions', { params: { exam_id: u.id } }),
      ]);
      setHapusUjian({ ...u, lembar: s.data.data.length, nilai: sub.data.data.length });
    } catch { /* pesan sudah muncul dari api.js */ }
  }

  async function jalankanHapusUjian() {
    setLoading(true);
    try {
      await api.delete(`/exams/${hapusUjian.id}`, { data: { dengan_nilai: true } });
      if (aktif?.id === hapusUjian.id) { setAktif(null); setDipilih([]); }
      setHapusUjian(null);
      await muat();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  // Pilihan materi diambil dari soal yang sudah dimuat, jadi selalu ada isinya.
  const OPSI_MATERI = (() => {
    const perMapel = new Map();
    const perSub = new Map();
    for (const q of bank) {
      const namaMapel = q.mapel || 'Tanpa mapel';
      if (q.subject_id && !perMapel.has(q.subject_id)) perMapel.set(q.subject_id, namaMapel);
      if (q.sub_chapter_id && !perSub.has(q.sub_chapter_id)) {
        perSub.set(q.sub_chapter_id, `${namaMapel}${q.tingkat ? ` t${q.tingkat}` : ''} › ${q.subbab || 'tanpa subbab'}`);
      }
    }
    return [
      { group: 'Per subbab', items: [...perSub].map(([id, label]) => ({ value: `s:${id}`, label })) },
      { group: 'Per mapel', items: [...perMapel].map(([id, label]) => ({ value: `m:${id}`, label })) },
    ].filter((g) => g.items.length);
  })();

  function cocokMateri(q) {
    if (materi === 'semua') return true;
    const [jenis, id] = materi.split(':');
    return jenis === 'm' ? q.subject_id === Number(id) : q.sub_chapter_id === Number(id);
  }

  // Soal satu materi dikumpulkan berdampingan supaya mudah dibaca.
  const tampil = bank
    .filter((q) => cocokMateri(q) && (tipe === 'SEMUA' || q.qtype === tipe)
      && q.text.toLowerCase().includes(cari.trim().toLowerCase()))
    .sort((a, b) => `${a.mapel || ''}~${a.subbab || ''}`.localeCompare(`${b.mapel || ''}~${b.subbab || ''}`) || a.id - b.id);

  const labelMateri = (q) => `${q.mapel || 'Tanpa mapel'}${q.tingkat ? ` t${q.tingkat}` : ''} › ${q.subbab || 'Tanpa subbab'}`;
  // tampil sudah urut materi, jadi cukup dipotong tiap ganti label.
  const kelompok = [];
  for (const q of tampil) {
    const label = labelMateri(q);
    const akhir = kelompok[kelompok.length - 1];
    if (akhir?.label === label) akhir.items.push(q); else kelompok.push({ label, items: [q] });
  }

  const semuaTampil = tampil.length > 0 && tampil.every((q) => dipilih.includes(q.id));
  const tersembunyi = dipilih.length - tampil.filter((q) => dipilih.includes(q.id)).length;
  function centangSemua() {
    if (semuaTampil) { setDipilih(dipilih.filter((id) => !tampil.some((q) => q.id === id))); return; }
    const baru = tampil.filter((q) => !dipilih.includes(q.id)).map((q) => q.id);
    if (dipilih.length + baru.length > MAKS) { setMsg(`Maksimal ${MAKS} soal per ujian.`); return; }
    setMsg('');
    setDipilih([...dipilih, ...baru]);
  }

  return (
    <div>
      <Panduan id="ujian" steps={['Pilih mapelnya dulu, nanti daftar ujian mapel itu muncul.', 'Isi judul + kelas lalu tekan + Ujian, atau klik Pilih pada ujian yang sudah ada.', 'Daftar soal langsung mengikuti subbab pilihanmu di bar atas halaman Materi & Soal — ubah lewat "Saring materi" bila perlu, centang soalnya, tekan Simpan pilihan.']} />
      <Paper withBorder shadow="xs" p="md" mb="md">
        <Title order={3} mb="xs">Pilih mapel</Title>
        {msg && <Alert color="orange" mb="sm">{msg}</Alert>}
        <Select label="Mapel" maw={420} placeholder={mapelList.length ? '— pilih mapel —' : 'belum ada mapel'} data={mapelList.map((m) => ({ value: String(m.id), label: m.name }))} value={form.subject_id} onChange={(v) => setForm({ ...form, subject_id: v || '' })} allowDeselect={false} />
        {!form.subject_id && <Text size="sm" c="dimmed" mt="sm">Pilih mapelnya dulu, nanti daftar ujian mapel itu muncul di bawah.</Text>}
        {form.subject_id && (
          <>
            <Title order={4} mt="lg" mb="xs">Daftar ujian {namaMapel} ({daftarUjian.length})</Title>
            {daftarUjian.length === 0 ? <Kosong teks="Belum ada ujian untuk mapel ini. Buat lewat form di bawah." /> : (
            <Table striped highlightOnHover mb="sm">
              <Table.Thead><Table.Tr><Table.Th>Judul</Table.Th><Table.Th>N soal</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>{daftarUjian.map((u) => <Table.Tr key={u.id} style={aktif?.id === u.id ? { background: 'var(--mantine-color-teal-0)' } : null}><Table.Td>{u.title}</Table.Td><Table.Td>{u.n_soal}</Table.Td><Table.Td><Group gap={6} wrap="nowrap"><Button size="xs" onClick={() => pilihUjian(u)}>Pilih</Button><Button size="xs" variant="outline" onClick={() => setUbahUjian({ id: u.id, title: u.title })}>Ubah</Button><Button size="xs" variant="outline" color="red" onClick={() => bukaHapus(u)}>Hapus</Button></Group></Table.Td></Table.Tr>)}</Table.Tbody>
            </Table>
            )}
            <form onSubmit={buat}>
              <Group grow align="flex-end">
                <TextInput label="Judul ujian" placeholder="cth: Ulangan Bab 1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Select label="Kelas" placeholder={kelas.length ? '— pilih kelas —' : 'belum ada kelas'} data={kelas.map((k) => ({ value: String(k.id), label: `${k.name} (${k.academic_year})` }))} value={form.class_id} onChange={(v) => setForm({ ...form, class_id: v || '' })} allowDeselect={false} />
              </Group>
              <Button type="submit" loading={loading} mt="sm">+ Ujian</Button>
            </form>
          </>
        )}
      </Paper>
      {aktif && (
        <Paper withBorder shadow="xs" p="md">
          <Title order={3} mb="xs">Tempel soal ke: {aktif.title} <Badge color="teal">{dipilih.length} dipilih</Badge></Title>
          {bank.length === 0 ? <Kosong teks="Bank soal kosong. Buat dulu di halaman Bank Soal." /> : (
          <>
            <Group grow align="flex-end" mb="sm">
              <Select label="Saring materi" data={[{ value: 'semua', label: 'Semua materi' }, ...OPSI_MATERI]} value={materi} onChange={(v) => setMateri(v || 'semua')} allowDeselect={false} />
              <Select label="Saring jenis soal" data={[{ value: 'SEMUA', label: 'Semua jenis' }, { value: 'PG', label: 'Pilihan ganda' }, { value: 'ISIAN', label: 'Isian singkat' }, { value: 'URAIAN', label: 'Uraian' }]} value={tipe} onChange={(v) => setTipe(v || 'SEMUA')} allowDeselect={false} />
              <TextInput label="Cari kata di soal" placeholder="cth: pecahan" value={cari} onChange={(e) => setCari(e.target.value)} />
            </Group>
            {tampil.length === 0 ? <Text size="sm" c="dimmed" mb="sm">Tidak ada soal yang cocok dengan saringan itu.</Text> : (
            <Table layout="fixed" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={44}><Checkbox checked={semuaTampil} indeterminate={!semuaTampil && tampil.some((q) => dipilih.includes(q.id))} onChange={centangSemua} aria-label="Pilih semua yang tampil" /></Table.Th>
                  <Table.Th w={110}>Jenis</Table.Th><Table.Th>Soal</Table.Th><Table.Th w={180}>Kunci</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{kelompok.map((g) => (
                <Fragment key={g.label}>
                  <Table.Tr bg="var(--mantine-color-teal-0)">
                    <Table.Td colSpan={4}><Text size="xs" fw={700}>{g.label} · {g.items.length} soal</Text></Table.Td>
                  </Table.Tr>
                  {g.items.map((q) => <Table.Tr key={q.id}><Table.Td><Checkbox checked={dipilih.includes(q.id)} onChange={() => centang(q.id)} aria-label="Pilih soal" /></Table.Td><Table.Td>{q.qtype}</Table.Td><Table.Td>{q.text}</Table.Td><Table.Td>{q.answer_key}</Table.Td></Table.Tr>)}
                </Fragment>
              ))}</Table.Tbody>
            </Table>
            )}
            <Text size="sm" c="dimmed" mt="xs">
              Menampilkan {tampil.length} dari {bank.length} soal{adaLagi ? ' (masih ada soal lama yang belum dimuat).' : '.'}{' '}
              {tersembunyi > 0 && <Text span c="orange">Ada {tersembunyi} soal terpilih yang tidak tampil karena saringan — "Simpan pilihan" tetap menyimpannya.</Text>}
            </Text>
            {adaLagi && <Button variant="outline" mt="xs" onClick={() => muatBank(bank[bank.length - 1].id)} loading={loading}>Muat 200 soal sebelumnya</Button>}
          </>
          )}
          <Group mt="sm">
            <Button onClick={simpan} loading={loading}>Simpan pilihan</Button>
            <Button variant="outline" onClick={() => setDipilih([])} disabled={!dipilih.length}>Kosongkan pilihan</Button>
          </Group>
        </Paper>
      )}
      {ubahUjian && (
        <Modal judul="Ubah judul ujian" tutup={() => setUbahUjian(null)}>
          <form onSubmit={simpanJudul}>
            <TextInput label="Judul ujian" value={ubahUjian.title} onChange={(e) => setUbahUjian({ ...ubahUjian, title: e.target.value })} mb="md" autoFocus />
            <Button type="submit" fullWidth loading={loading} disabled={!ubahUjian.title.trim()}>Simpan</Button>
          </form>
        </Modal>
      )}
      {hapusUjian && (
        <Modal judul="Hapus ujian?" tutup={() => setHapusUjian(null)}>
          <p>Yakin hapus ujian <b>{hapusUjian.title}</b>?</p>
          <p style={{ color: '#64748b' }}>
            {hapusUjian.lembar > 0 ? `${hapusUjian.lembar} lembar cetak` : 'Belum ada lembar cetak'}
            {hapusUjian.nilai > 0 ? ` dan ${hapusUjian.nilai} nilai siswa` : ''} ikut terhapus dan tidak bisa dikembalikan. Soal di bank tetap aman.
          </p>
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapusUjian} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapusUjian(null)}>Batal</Button>
        </Modal>
      )}
    </div>
  );
}
