import { useEffect, useState } from 'react';
import { Button, Group, Paper, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

// Tanda pisah selama ringkasan belum masuk, supaya tak ada angka karangan.
const AWAL = {
  sekolah: '', npsn: '',
  kelas: '-', siswa: '-', mapel: '-', materi: '-', soal: '-', ujian: '-', lembar: '-', perlu_koreksi: '-', sudah_final: '-',
  kelas_rinci: [], mapel_rinci: [],
};

// Lima langkah kerja aplikasi, urut. Dipakai untuk menunjuk langkah mana yang belum diisi.
const ALUR = [
  { kunci: 'materi', nama: 'Materi', ke: '/soal', ket: () => 'berkas materi pelajaran' },
  { kunci: 'soal', nama: 'Soal', ke: '/soal?tab=soal', ket: () => 'soal tersimpan di bank' },
  { kunci: 'ujian', nama: 'Ujian', ke: '/soal?tab=ujian', ket: () => 'ujian siap dicetak' },
  { kunci: 'lembar', nama: 'Cetak', ke: '/cetak', ket: () => 'lembar siap dibagikan' },
  { kunci: 'perlu_koreksi', nama: 'Nilai', ke: '/nilai', ket: (s) => `menunggu dikoreksi, ${s.sudah_final} sudah final` },
];

// Langkah yang masih kosong diberi tahu harus mulai dari mana.
const MULAI = {
  materi: 'Unggah materi pelajarannya dulu, soalnya bisa dibuat otomatis dari situ.',
  soal: 'Buka bank soal, pilih subbab, lalu buat soalnya.',
  ujian: 'Susun ujian dengan mencentang soal dari bank.',
  lembar: 'Cetak kartu ujian beserta QR-nya untuk tiap siswa.',
  perlu_koreksi: 'Unggah foto jawaban siswa lewat menu Nilai.',
};

function sapaan() {
  const j = new Date().getHours();
  if (j < 11) return 'Selamat pagi';
  if (j < 15) return 'Selamat siang';
  if (j < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export default function Dashboard() {
  const nav = useNavigate();
  const sempit = useMediaQuery('(max-width: 48em)');
  const [status, setStatus] = useState('memuat'); // memuat | siap | gagal
  const [s, setS] = useState(AWAL);

  async function muat() {
    setStatus('memuat');
    try {
      const r = await api.get('/stats', { silent: true });
      setS(r.data.data);
      setStatus('siap');
    } catch { setStatus('gagal'); } // halte ini yang memberi tahu, bukan popup
  }
  useEffect(() => { if (localStorage.getItem('sigeso_token')) muat(); }, []);

  let nama = 'Bapak/Ibu Guru';
  try { nama = JSON.parse(localStorage.getItem('sigeso_user'))?.name || nama; } catch { /* pakai sebutan umum */ }

  const angka = (k) => Number(s[k]) || 0;
  const tampil = (k) => (status === 'siap' ? s[k] : '...');
  const adaIsi = (a) => (a.kunci === 'perlu_koreksi' ? angka('perlu_koreksi') + angka('sudah_final') > 0 : angka(a.kunci) > 0);
  const jalan = ALUR.filter(adaIsi).length;
  // Fokus = langkah pertama yang masih kosong; kalau semua terisi, tunggakan koreksi.
  const fokus = status === 'siap' ? (ALUR.find((a) => !adaIsi(a)) || (angka('perlu_koreksi') > 0 ? ALUR[4] : null)) : null;

  const aksi = status === 'gagal'
    ? { teks: 'Ringkasan sekolah gagal dimuat.', tombol: 'Coba lagi', klik: muat }
    : status === 'memuat'
      ? { teks: 'Memuat ringkasan sekolah...', tombol: null }
      : angka('perlu_koreksi') > 0
        ? { teks: `${s.perlu_koreksi} lembar jawaban sudah diunggah dan menunggu dikoreksi.`, tombol: 'Koreksi sekarang', ke: '/nilai', genting: true }
        : fokus
          ? { teks: `${fokus.nama} belum ada isinya. ${MULAI[fokus.kunci]}`, tombol: `Buka ${fokus.nama}`, ke: fokus.ke }
          : { teks: 'Semua langkah sudah berisi dan tidak ada tunggakan koreksi.', tombol: 'Cetak ujian', ke: '/cetak' };

  const daftar = (isi, kosong) => (status === 'siap'
    ? (isi.length ? isi : [kosong])
    : ['...']);

  return (
    <div>
      <Paper className="kata-masuk" p={sempit ? 'md' : 'xl'} mb="lg"
        style={{
          borderRadius: 18,
          border: 'none',
          // Gradasi dari warna aplikasi sendiri: memisahkan baris "identitas + langkah berikutnya"
          // di atas dari area kerja di bawahnya. Berhenti di primer-gelap, bukan primer terang,
          // supaya teks putih tetap lolos kontras di seluruh gradasi.
          background: 'linear-gradient(135deg, var(--sisi) 0%, var(--primer-gelap) 100%)',
          boxShadow: '0 10px 24px rgb(11 46 43 / 0.18)',
        }}>
        <Text size="sm" style={{ color: '#c9e6e1' }}>{sapaan()}</Text>
        <Title order={2} style={{ color: '#ffffff' }}>{nama}</Title>
        <Text size="sm" style={{ color: '#c9e6e1' }}>
          {s.sekolah ? `${s.sekolah}${s.npsn ? ` · NPSN ${s.npsn}` : ''}` : 'Sigeso, generator soal sekolah'}
        </Text>
        <Group justify="space-between" align="center" gap="sm" wrap={sempit ? 'wrap' : 'nowrap'} mt="lg"
          style={{ background: 'rgb(0 0 0 / 0.16)', border: '1px solid rgb(255 255 255 / 0.18)', borderRadius: 12, padding: '12px 14px' }}>
          <Text style={{ color: '#ffffff' }}>{aksi.teks}</Text>
          {aksi.tombol && (
            <Button onClick={aksi.klik || (() => nav(aksi.ke))}
              style={aksi.genting ? { background: '#fef3c7', color: 'var(--aksen)' } : { background: '#ffffff', color: 'var(--primer-gelap)' }}>
              {aksi.tombol}
            </Button>
          )}
        </Group>
      </Paper>

      <Paper withBorder shadow="xs" p="lg" mb="lg">
        <Group justify="space-between" align="baseline" wrap="wrap" mb="md">
          <Title order={3}>Alur kerja</Title>
          <Text size="sm" style={{ color: '#64748b' }}>
            {status === 'siap' ? `${jalan} dari ${ALUR.length} langkah sudah ada isinya` : ''}
          </Text>
        </Group>
        <div style={{ display: 'flex', flexDirection: sempit ? 'column' : 'row' }}>
          {ALUR.map((a, i) => {
            const ini = fokus?.kunci === a.kunci;
            return (
              <div key={a.kunci}
                style={{
                  flex: 1,
                  padding: sempit ? '10px 12px' : '4px 16px',
                  borderLeft: !sempit && i ? '1px solid var(--garis)' : 'none',
                  borderTop: sempit && i ? '1px solid var(--garis)' : 'none',
                }}>
                <Group gap={8} wrap="nowrap" mb={2}>
                  <span className="lingkar" data-ada={adaIsi(a) ? 1 : 0} data-fokus={ini ? 1 : 0}>{i + 1}</span>
                  <Text fw={600}>{a.nama}</Text>
                </Group>
                <Text style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15, color: ini ? 'var(--aksen)' : 'var(--sisi)' }}>
                  {tampil(a.kunci)}
                </Text>
                <Text size="xs" style={{ color: '#64748b' }}>{a.ket(s)}</Text>
              </div>
            );
          })}
        </div>
      </Paper>

      <Paper withBorder shadow="xs" p="lg">
        <Title order={4} mb="md">Data kelas dan mapel</Title>
        <div style={{ display: 'flex', flexDirection: sempit ? 'column' : 'row', gap: sempit ? 24 : 48 }}>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, color: 'var(--sisi)' }}>{tampil('kelas')}</Text>
            <Text fw={600} style={{ color: '#475569' }}>Kelas</Text>
            <div style={{ marginTop: 8 }}>
              {daftar(s.kelas_rinci.map((k) => `${k.nama} · ${k.siswa} siswa`), 'Belum ada kelas.').map((t, i) => (
                <Text key={i} size="sm" style={{ color: '#64748b' }}>{t}</Text>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, color: 'var(--sisi)' }}>{tampil('siswa')}</Text>
            <Text fw={600} style={{ color: '#475569' }}>Siswa aktif</Text>
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, color: 'var(--sisi)' }}>{tampil('mapel')}</Text>
            <Text fw={600} style={{ color: '#475569' }}>Mapel</Text>
            <div style={{ marginTop: 8 }}>
              {daftar(s.mapel_rinci.map((m) => `${m.nama} · ${m.soal} soal`), 'Belum ada mapel.').map((t, i) => (
                <Text key={i} size="sm" style={{ color: '#64748b' }}>{t}</Text>
              ))}
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
}
