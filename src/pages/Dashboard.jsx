import { useEffect, useState } from 'react';
import { Button, Group, Paper, SimpleGrid, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

// Tanda pisah selama ringkasan belum masuk, supaya tak ada angka karangan.
const AWAL = { sekolah: '', npsn: '', mapel: '-', topik: '-', soal: '-', ujian: '-' };

// Ringkasan yang dipakai halaman ini; urutannya sama dengan alur kerja guru.
const KARTU = [
  { kunci: 'mapel', nama: 'Mapel', ket: 'mapel di sekolah ini' },
  { kunci: 'topik', nama: 'Topik', ket: 'topik yang tersimpan' },
  { kunci: 'soal', nama: 'Soal', ket: 'soal di bank' },
  { kunci: 'ujian', nama: 'Ujian', ket: 'ujian dibuat' },
];

function sapaan() {
  const j = new Date().getHours();
  if (j < 11) return 'Selamat pagi';
  if (j < 15) return 'Selamat siang';
  if (j < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export default function Dashboard() {
  const nav = useNavigate();
  const [status, setStatus] = useState('memuat'); // memuat | siap | gagal
  const [s, setS] = useState(AWAL);

  async function muat() {
    setStatus('memuat');
    try {
      const r = await api.get('/stats', { silent: true });
      setS(r.data.data);
      setStatus('siap');
    } catch { setStatus('gagal'); }
  }
  useEffect(() => { if (localStorage.getItem('sigeso_token')) muat(); }, []);

  let nama = 'Bapak/Ibu Guru';
  try { nama = JSON.parse(localStorage.getItem('sigeso_user'))?.name || nama; } catch { /* pakai sebutan umum */ }

  const angka = (k) => Number(s[k]) || 0;
  const tampil = (k) => (status === 'siap' ? s[k] : '...');
  const belumAdaUjian = status === 'siap' && angka('ujian') === 0;

  return (
    <div>
      <Paper p="xl" mb="lg"
        style={{
          borderRadius: 18,
          border: 'none',
          background: 'linear-gradient(135deg, var(--sisi) 0%, var(--primer-gelap) 100%)',
          boxShadow: '0 10px 24px rgb(11 46 43 / 0.18)',
        }}>
        <Text size="sm" style={{ color: '#c9e6e1' }}>{sapaan()}</Text>
        <Title order={2} style={{ color: '#ffffff' }}>{nama}</Title>
        <Text size="sm" style={{ color: '#c9e6e1' }}>
          {s.sekolah ? `${s.sekolah}${s.npsn ? ` · NPSN ${s.npsn}` : ''}` : 'Sigeso, generator soal sekolah'}
        </Text>
        <Group justify="space-between" align="center" gap="sm" wrap="wrap" mt="lg"
          style={{ background: 'rgb(0 0 0 / 0.16)', border: '1px solid rgb(255 255 255 / 0.18)', borderRadius: 12, padding: '12px 14px' }}>
          <Text style={{ color: '#ffffff' }}>
            {status === 'gagal'
              ? 'Ringkasan sekolah gagal dimuat.'
              : belumAdaUjian
                ? 'Belum ada ujian. Pilih mapel dan topik, lalu biarkan Sigeso membuat soalnya.'
                : 'Alur: Profil → Ujian → Setujui soal → Cetak soal + kunci.'}
          </Text>
          {status === 'gagal' ? (
            <Button onClick={muat} style={{ background: '#ffffff', color: 'var(--primer-gelap)' }}>Coba lagi</Button>
          ) : (
            <Button onClick={() => nav('/ujian')} style={{ background: '#ffffff', color: 'var(--primer-gelap)' }}>
              {belumAdaUjian ? 'Buat ujian pertama' : 'Buka Ujian'}
            </Button>
          )}
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
        {KARTU.map((k) => (
          <Paper key={k.kunci} withBorder shadow="xs" p="md">
            <Text fw={600} style={{ color: '#475569' }}>{k.nama}</Text>
            <Text style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, color: 'var(--sisi)' }}>{tampil(k.kunci)}</Text>
            <Text size="xs" style={{ color: '#64748b' }}>{k.ket}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder shadow="xs" p="lg">
        <Title order={4} mb="xs">Yang bisa dilakukan di sini</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Satu ujian memakai satu mapel dan satu kelas. Soal yang belum disetujui tidak ikut dihitung atau dicetak.
        </Text>
        <Group>
          <Button variant="outline" onClick={() => nav('/ujian')}>Ujian</Button>
          <Button variant="outline" onClick={() => nav('/soal')}>Bank soal</Button>
          <Button variant="outline" onClick={() => nav('/profil')}>Profil &amp; kelas</Button>
        </Group>
      </Paper>
    </div>
  );
}
