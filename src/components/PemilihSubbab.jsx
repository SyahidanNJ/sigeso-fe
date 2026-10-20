import { useEffect, useState } from 'react';
import { Button, Group, Paper, Select, SimpleGrid, Text, TextInput } from '@mantine/core';
import api from '../lib/api';
import { JENJANG } from '../lib/jenjang';
import Modal from './Modal';

const JENIS = {
  mapel: { label: 'Mapel', basis: '/subjects' },
  topik: { label: 'Topik', basis: '/topics' },
  bab: { label: 'Bab', basis: '/chapters' },
  subbab: { label: 'Subbab', basis: '/subchapters' },
};
const KUNCI = { mapel: 'subject_id', topik: 'topic_id', bab: 'chapter_id', subbab: 'sub_chapter_id' };

// Pemilih bertingkat untuk halaman Materi & Soal. Ia menempel saat digulir supaya
// ganti subbab tak perlu naik ke atas, dan menyimpan rantai pilihannya agar bar
// tidak kosong saat halaman dimuat ulang.
export default function PemilihSubbab({ awal, onPilih }) {
  const [mapel, setMapel] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [topik, setTopik] = useState([]);
  const [bab, setBab] = useState([]);
  const [sub, setSub] = useState([]);
  const [pilih, setPilih] = useState(() => (awal ? {
    subject_id: String(awal.subject_id),
    grade_level: String(awal.grade_level),
    topic_id: String(awal.topic_id),
    chapter_id: String(awal.chapter_id),
    sub_chapter_id: String(awal.id),
  } : {}));
  const [nama, setNama] = useState('');
  const [mBaris, setMBaris] = useState(null);
  const [hapus, setHapus] = useState(null);
  const [loading, setLoading] = useState(false);

  const ambil = (path, params) => api.get(path, { params }).then((r) => r.data.data);

  useEffect(() => {
    ambil('/subjects').then(setMapel).catch(() => { /* pesan sudah muncul dari api.js */ });
    ambil('/classes').then(setKelas).catch(() => { /* pesan sudah muncul dari api.js */ });
    if (!awal) return;
    // Muat rantai yang tersimpan supaya kelima pilihan tampil seperti terakhir dipakai.
    (async () => {
      try {
        setTopik(await ambil('/topics', { subject_id: awal.subject_id, grade_level: awal.grade_level }));
        setBab(await ambil('/chapters', { topic_id: awal.topic_id }));
        setSub(await ambil('/subchapters', { chapter_id: awal.chapter_id }));
      } catch { /* pesan sudah muncul dari api.js */ }
    })();
  }, []);

  async function muatTopik(subjectId, gradeLevel) {
    if (!subjectId || !gradeLevel) { setTopik([]); return; }
    try { setTopik(await ambil('/topics', { subject_id: subjectId, grade_level: gradeLevel })); } catch { /* pesan sudah muncul dari api.js */ }
  }
  async function muatBab(topicId) {
    if (!topicId) { setBab([]); return; }
    try { setBab(await ambil('/chapters', { topic_id: topicId })); } catch { /* pesan sudah muncul dari api.js */ }
  }
  async function muatSub(chapterId) {
    if (!chapterId) { setSub([]); return; }
    try { setSub(await ambil('/subchapters', { chapter_id: chapterId })); } catch { /* pesan sudah muncul dari api.js */ }
  }

  const muatUlang = (jenis) => (
    jenis === 'mapel' ? ambil('/subjects').then(setMapel)
      : jenis === 'topik' ? ambil('/topics', { subject_id: pilih.subject_id, grade_level: pilih.grade_level }).then(setTopik)
        : jenis === 'bab' ? ambil('/chapters', { topic_id: pilih.topic_id }).then(setBab)
          : ambil('/subchapters', { chapter_id: pilih.chapter_id }).then(setSub)
  );

  // Memilih satu baris membuang pilihan baris di bawahnya; subbab yang dibuang
  // juga harus dilepas dari halaman di bawah (materi & daftar soal).
  function pilihNilai(jenis, v) {
    if (jenis === 'mapel') {
      setPilih((p) => ({ ...p, subject_id: v, topic_id: null, chapter_id: null, sub_chapter_id: null }));
      setTopik([]); setBab([]); setSub([]);
      onPilih?.(null);
      muatTopik(v, pilih.grade_level);
    } else if (jenis === 'tingkat') {
      setPilih((p) => ({ ...p, grade_level: v, topic_id: null, chapter_id: null, sub_chapter_id: null }));
      setBab([]); setSub([]);
      onPilih?.(null);
      muatTopik(pilih.subject_id, v);
    } else if (jenis === 'topik') {
      setPilih((p) => ({ ...p, topic_id: v, chapter_id: null, sub_chapter_id: null }));
      setSub([]);
      onPilih?.(null);
      muatBab(v);
    } else if (jenis === 'bab') {
      setPilih((p) => ({ ...p, chapter_id: v, sub_chapter_id: null }));
      onPilih?.(null);
      muatSub(v);
    } else {
      setPilih((p) => ({ ...p, sub_chapter_id: v }));
      const s = sub.find((x) => String(x.id) === String(v));
      if (s) {
        onPilih?.({
          id: s.id,
          nama: s.name,
          subject_id: Number(pilih.subject_id),
          grade_level: Number(pilih.grade_level),
          topic_id: Number(pilih.topic_id),
          chapter_id: Number(pilih.chapter_id),
        });
      }
    }
  }

  const isiPayload = (jenis, namaBaru) => {
    if (jenis === 'mapel') return { name: namaBaru };
    if (jenis === 'topik') return { subject_id: Number(pilih.subject_id), grade_level: Number(pilih.grade_level), name: namaBaru };
    if (jenis === 'bab') return { topic_id: Number(pilih.topic_id), name: namaBaru };
    return { chapter_id: Number(pilih.chapter_id), name: namaBaru };
  };

  async function simpanBaris(e) {
    e.preventDefault();
    const { jenis, item } = mBaris;
    setLoading(true);
    try {
      if (item) await api.put(`${JENIS[jenis].basis}/${item.id}`, isiPayload(jenis, nama));
      else await api.post(JENIS[jenis].basis, isiPayload(jenis, nama));
      setMBaris(null);
      await muatUlang(jenis);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  // Kalau yang dihapus sedang terpilih, kosongkan pilihan itu beserta turunannya.
  function bersihkanTerkait(jenis, id) {
    const kunci = KUNCI[jenis];
    if (String(pilih[kunci]) !== String(id)) return;
    onPilih?.(null);
    if (kunci === 'sub_chapter_id') { setPilih((p) => ({ ...p, sub_chapter_id: null })); return; }
    if (kunci === 'chapter_id') { setPilih((p) => ({ ...p, chapter_id: null, sub_chapter_id: null })); setSub([]); return; }
    if (kunci === 'topic_id') { setPilih((p) => ({ ...p, topic_id: null, chapter_id: null, sub_chapter_id: null })); setBab([]); setSub([]); return; }
    setPilih((p) => ({ ...p, subject_id: null, topic_id: null, chapter_id: null, sub_chapter_id: null }));
    setTopik([]); setBab([]); setSub([]);
  }

  async function jalankanHapus() {
    const { jenis, id } = hapus;
    setLoading(true);
    try {
      await api.delete(`${JENIS[jenis].basis}/${id}`);
      setHapus(null);
      bersihkanTerkait(jenis, id);
      await muatUlang(jenis);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setLoading(false); }
  }

  // Kosongkan seluruh pilihan supaya daftar soal kembali menampilkan semua subbab.
  function reset() {
    setPilih({});
    setTopik([]); setBab([]); setSub([]);
    onPilih?.(null);
  }

  const cariNama = (arr, id) => (arr.find((x) => String(x.id) === String(id)) || {}).name;
  const jejak = [
    cariNama(mapel, pilih.subject_id),
    pilih.grade_level ? `Kelas ${pilih.grade_level}` : null,
    cariNama(topik, pilih.topic_id),
    cariNama(bab, pilih.chapter_id),
    cariNama(sub, pilih.sub_chapter_id),
  ].filter(Boolean).join('  ›  ');

  // Tingkat hanya memuat kelas yang sudah dibuat di halaman Kelas & Siswa.
  const TINGKAT = JENJANG
    .map((j) => ({
      group: j.label,
      items: [...new Set(kelas.filter((k) => k.jenjang === j.value).map((k) => k.level))]
        .sort((a, b) => a - b)
        .map((lv) => ({ value: String(lv), label: `Kelas ${lv}` })),
    }))
    .filter((g) => g.items.length);

  const BARIS = [
    { jenis: 'mapel', kunci: 'subject_id', label: 'Mapel', siap: true, opsi: mapel.map((m) => ({ value: String(m.id), label: m.name })) },
    { jenis: 'tingkat', kunci: 'grade_level', label: 'Tingkat', siap: !!pilih.subject_id && TINGKAT.length > 0, opsi: TINGKAT, petunjuk: TINGKAT.length ? undefined : 'belum ada kelas — buat dulu di halaman Kelas & Siswa' },
    { jenis: 'topik', kunci: 'topic_id', label: 'Topik', siap: !!pilih.subject_id && !!pilih.grade_level, opsi: topik.map((t) => ({ value: String(t.id), label: t.name })) },
    { jenis: 'bab', kunci: 'chapter_id', label: 'Bab', siap: !!pilih.topic_id, opsi: bab.map((b) => ({ value: String(b.id), label: b.name })) },
    { jenis: 'subbab', kunci: 'sub_chapter_id', label: 'Subbab', siap: !!pilih.chapter_id, opsi: sub.map((s) => ({ value: String(s.id), label: s.name })) },
  ];

  return (
    <Paper withBorder shadow="xs" p="sm" mb="md" className="pemilih" style={{ background: 'var(--kartu)' }}>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="xs" verticalSpacing="xs">
        {BARIS.map((b) => {
          const nilai = pilih[b.kunci] ? String(pilih[b.kunci]) : null;
          const terpilih = b.opsi.flatMap((o) => (o.items ? o.items : [o])).find((o) => o.value === nilai);
          return (
            <div key={b.jenis}>
              <Select
                label={b.label}
                size="sm"
                placeholder={b.petunjuk || (b.siap ? `— pilih ${b.label.toLowerCase()} —` : 'pilih baris di atas dulu')}
                data={b.opsi}
                value={nilai}
                disabled={!b.siap}
                onChange={(v) => pilihNilai(b.jenis, v)}
                allowDeselect={false}
              />
              {b.jenis !== 'tingkat' && (
                <Group gap={4} mt={4} wrap="nowrap">
                  <Button size="compact-xs" variant="outline" disabled={!b.siap} onClick={() => { setNama(''); setMBaris({ jenis: b.jenis, item: null }); }}>Tambah</Button>
                  <Button size="compact-xs" variant="subtle" disabled={!nilai} onClick={() => { setNama(terpilih?.label || ''); setMBaris({ jenis: b.jenis, item: { id: Number(nilai) } }); }}>Ubah</Button>
                  <Button size="compact-xs" variant="subtle" color="red" disabled={!nilai} onClick={() => setHapus({ jenis: b.jenis, id: Number(nilai), nama: terpilih?.label || '' })}>Hapus</Button>
                </Group>
              )}
            </div>
          );
        })}
      </SimpleGrid>
      {(jejak || pilih.subject_id) && (
        <Group mt="xs" gap="sm" wrap="nowrap">
          {jejak && <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 0 }}>Posisi: {jejak}</Text>}
          <Button size="compact-xs" variant="outline" color="gray" onClick={reset} style={{ marginLeft: 'auto' }} title="Kosongkan semua pilihan">
            Reset pilihan
          </Button>
        </Group>
      )}
      {mBaris && (
        <Modal judul={`${mBaris.item ? 'Ubah' : 'Tambah'} ${JENIS[mBaris.jenis].label}`} tutup={() => setMBaris(null)}>
          <form onSubmit={simpanBaris}>
            <TextInput label={`Nama ${JENIS[mBaris.jenis].label.toLowerCase()}`} value={nama} onChange={(e) => setNama(e.target.value)} mb="md" autoFocus />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}
      {hapus && (
        <Modal judul="Hapus?" tutup={() => setHapus(null)}>
          <p>Yakin hapus {JENIS[hapus.jenis].label.toLowerCase()} <b>{hapus.nama}</b>? Semua isi di bawahnya ikut terhapus.</p>
          {hapus.jenis !== 'subbab' && <p style={{ color: '#64748b' }}>Kalau sudah ada soal atau materi yang memakainya, penghapusan akan ditolak.</p>}
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapus} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapus(null)}>Batal</Button>
        </Modal>
      )}
    </Paper>
  );
}
