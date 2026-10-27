import { useEffect, useState } from 'react';
import { Button, Group, Paper, Select, SimpleGrid, Text, TextInput } from '@mantine/core';
import api from '../lib/api';
import { JENJANG } from '../lib/jenjang';
import Modal from './Modal';

const JENIS = {
  mapel: { label: 'Mapel', basis: '/subjects' },
  topik: { label: 'Topik', basis: '/topics' },
};
const KUNCI = { mapel: 'subject_id', topik: 'topic_id' };

// Pemilih bertingkat: Tingkat -> Mapel -> Topik. Mapel dimuat per tingkat karena
// Matematika kelas 4 dan kelas 5 adalah baris berbeda. Topik yang terpilih jadi
// tempat menempelnya materi dan penyaring daftar soal di bawahnya.
export default function PemilihTopik({ awal, onPilih }) {
  const [kelas, setKelas] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [topik, setTopik] = useState([]);
  const [pilih, setPilih] = useState(() => (awal ? {
    grade_level: String(awal.grade_level),
    subject_id: String(awal.subject_id),
    topic_id: String(awal.topic_id),
  } : {}));
  const [nama, setNama] = useState('');
  const [mBaris, setMBaris] = useState(null);
  const [hapus, setHapus] = useState(null);
  const [loading, setLoading] = useState(false);

  const ambil = (path, params) => api.get(path, { params }).then((r) => r.data.data);

  useEffect(() => {
    ambil('/classes').then(setKelas).catch(() => { /* pesan sudah muncul dari api.js */ });
    if (!awal) return;
    // Muat rantai yang tersimpan supaya pilihan tampil seperti terakhir dipakai.
    (async () => {
      try {
        setMapel(await ambil('/subjects', { grade_level: awal.grade_level }));
        setTopik(await ambil('/topics', { subject_id: awal.subject_id }));
      } catch { /* pesan sudah muncul dari api.js */ }
    })();
  }, []);

  async function muatMapel(grade) {
    if (!grade) { setMapel([]); return; }
    try { setMapel(await ambil('/subjects', { grade_level: grade })); } catch { /* pesan sudah muncul dari api.js */ }
  }
  async function muatTopik(subjectId) {
    if (!subjectId) { setTopik([]); return; }
    try { setTopik(await ambil('/topics', { subject_id: subjectId })); } catch { /* pesan sudah muncul dari api.js */ }
  }

  const muatUlang = (jenis) => (jenis === 'mapel' ? muatMapel(pilih.grade_level) : muatTopik(pilih.subject_id));

  // Memilih satu baris membuang pilihan di bawahnya; topik yang dibuang juga
  // dilepas dari halaman di bawah (materi & daftar soal).
  function pilihNilai(jenis, v) {
    if (jenis === 'tingkat') {
      setPilih({ grade_level: v });
      setTopik([]);
      onPilih?.(null);
      muatMapel(v);
    } else if (jenis === 'mapel') {
      setPilih((p) => ({ ...p, subject_id: v, topic_id: null }));
      onPilih?.(null);
      muatTopik(v);
    } else {
      setPilih((p) => ({ ...p, topic_id: v }));
      const t = topik.find((x) => String(x.id) === String(v));
      if (t) {
        onPilih?.({
          id: t.id,
          nama: t.name,
          topic_id: t.id,
          subject_id: Number(pilih.subject_id),
          grade_level: Number(pilih.grade_level),
        });
      }
    }
  }

  const isiPayload = (jenis, namaBaru) => (jenis === 'mapel'
    ? { name: namaBaru, grade_level: Number(pilih.grade_level) }
    : { subject_id: Number(pilih.subject_id), name: namaBaru });

  async function simpanBaris(e) {
    e.preventDefault();
    const { jenis, item } = mBaris;
    setLoading(true);
    try {
      if (item) await api.put(`${JENIS[jenis].basis}/${item.id}`, isiPayload(jenis, nama));
      else await api.post(JENIS[jenis].basis, isiPayload(jenis, nama));
      setMBaris(null);
      await muatUlang(jenis);
    } catch { /* pesan sudah muncul di api.js */ } finally { setLoading(false); }
  }

  // Kalau yang dihapus sedang terpilih, kosongkan pilihan itu beserta turunannya.
  function bersihkanTerkait(jenis, id) {
    const kunci = KUNCI[jenis];
    if (String(pilih[kunci]) !== String(id)) return;
    onPilih?.(null);
    if (kunci === 'topic_id') { setPilih((p) => ({ ...p, topic_id: null })); return; }
    setPilih((p) => ({ ...p, subject_id: null, topic_id: null }));
    setTopik([]);
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

  // Kosongkan seluruh pilihan supaya daftar soal kembali menampilkan semua topik.
  function reset() {
    setPilih({});
    setTopik([]);
    onPilih?.(null);
  }

  const cariNama = (arr, id) => (arr.find((x) => String(x.id) === String(id)) || {}).name;
  const jejak = [
    pilih.grade_level ? `Kelas ${pilih.grade_level}` : null,
    cariNama(mapel, pilih.subject_id),
    cariNama(topik, pilih.topic_id),
  ].filter(Boolean).join('  ›  ');

  // Tingkat hanya memuat kelas yang sudah dibuat di Profil atau Sekolah.
  const TINGKAT = JENJANG
    .map((j) => ({
      group: j.label,
      items: [...new Set(kelas.filter((k) => k.jenjang === j.value).map((k) => k.level))]
        .sort((a, b) => a - b)
        .map((lv) => ({ value: String(lv), label: `Kelas ${lv}` })),
    }))
    .filter((g) => g.items.length);

  const BARIS = [
    { jenis: 'tingkat', kunci: 'grade_level', label: 'Tingkat', siap: TINGKAT.length > 0, opsi: TINGKAT, petunjuk: TINGKAT.length ? undefined : 'belum ada kelas — buat di halaman Profil' },
    { jenis: 'mapel', kunci: 'subject_id', label: 'Mapel', siap: !!pilih.grade_level, opsi: mapel.map((m) => ({ value: String(m.id), label: m.name })) },
    { jenis: 'topik', kunci: 'topic_id', label: 'Topik', siap: !!pilih.subject_id, opsi: topik.map((t) => ({ value: String(t.id), label: t.name })) },
  ];

  return (
    <Paper withBorder shadow="xs" p="sm" mb="md" className="pemilih" style={{ background: 'var(--kartu)' }}>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs" verticalSpacing="xs">
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
      {(jejak || pilih.grade_level) && (
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
            <TextInput
              label={`Nama ${JENIS[mBaris.jenis].label.toLowerCase()}${mBaris.jenis === 'mapel' ? ` kelas ${pilih.grade_level}` : ''}`}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              mb="md"
              autoFocus
            />
            <Button type="submit" fullWidth loading={loading}>Simpan</Button>
          </form>
        </Modal>
      )}
      {hapus && (
        <Modal judul="Hapus?" tutup={() => setHapus(null)}>
          <p>Yakin hapus {JENIS[hapus.jenis].label.toLowerCase()} <b>{hapus.nama}</b>? Semua isi di bawahnya ikut terhapus.</p>
          <p style={{ color: '#64748b' }}>Kalau sudah ada soal atau materi yang memakainya, penghapusan akan ditolak.</p>
          <Button color="red" fullWidth loading={loading} onClick={jalankanHapus} mb="sm">Ya, hapus</Button>
          <Button variant="outline" fullWidth onClick={() => setHapus(null)}>Batal</Button>
        </Modal>
      )}
    </Paper>
  );
}
