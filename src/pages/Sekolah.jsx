import { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Group, Paper, Select, Text, Textarea, TextInput, Title } from '@mantine/core';
import api from '../lib/api';
import Panduan from '../components/Panduan';
import Kosong from '../components/Kosong';

const AWAL = { name: '', npsn: '', address: '' };
const KUNCI_DRAFT = 'sigeso_sekolah_draft';
const MANUAL = 'Isi datanya manual saja.';

const PANDUAN = [
  'Ketik nama sekolah atau NPSN di kotak pencarian, lalu pilih sekolah Anda dari daftar.',
  'Kalau sekolah Anda tidak ada di daftar, isi ketiga kolom di bawah langsung — hasilnya sama.',
  'Nama, NPSN, dan alamat yang terisi otomatis boleh diperbaiki manual.',
  'Tekan Simpan. Nama ini yang muncul di halaman ini dan di daftar pendaftaran pengguna baru.',
];

// Pesan galat berstatus 5xx disembunyikan errorHandler jadi "Terjadi kesalahan
// server.", jadi dua kasus sumber luar dipilih dari kodenya. Kode lain (404/429)
// pesannya sudah manusiawi dari server, pakai apa adanya.
const PESAN_KODE = {
  NOT_FOUND: 'Sekolah itu tak ada di data referensi.',
  SOURCE_CHANGED: 'Bentuk data di situs referensi berubah, pengisian otomatis dimatikan sementara.',
  SOURCE_SCRAPE_FAILED: 'Data referensi Kemendikdasmen sedang tidak bisa dihubungi.',
};

function pesanGagal(e) {
  const kode = e.response?.data?.code;
  const inti = PESAN_KODE[kode] || e.userMessage || 'Data referensi gagal diambil.';
  return PESAN_KODE[kode] ? `${inti} ${MANUAL}` : inti;
}

export default function Sekolah() {
  const [data, setData] = useState(null);
  const [muat, setMuat] = useState(true);
  const [form, setForm] = useState(null); // null = sedang tidak mengubah
  const [kata, setKata] = useState('');
  const [hasil, setHasil] = useState([]);
  const [catatan, setCatatan] = useState('');
  const [peringatan, setPeringatan] = useState(false);
  const [tunggu, setTunggu] = useState(null);
  const [simpanLoading, setSimpanLoading] = useState(false);

  async function muatSekolah() {
    try {
      const r = await api.get('/institutions');
      setData(r.data.data[0] || null);
    } catch { /* pesan sudah muncul dari api.js */ } finally { setMuat(false); }
  }

  useEffect(() => {
    // Suntingan yang belum disimpan dititipkan, karena pindah menu di aplikasi
    // satu halaman menghapus isian form diam-diam.
    try {
      const draft = JSON.parse(sessionStorage.getItem(KUNCI_DRAFT));
      if (draft && typeof draft === 'object') {
        const { kata: kataDraft = '', ...isi } = draft;
        setForm({ ...AWAL, ...isi });
        setKata(kataDraft);
        setCatatan('Melanjutkan perubahan yang belum disimpan. Periksa dulu, lalu Simpan — atau tekan Batal.');
      }
    } catch { sessionStorage.removeItem(KUNCI_DRAFT); }
    muatSekolah();
  }, []);

  useEffect(() => {
    if (!form) return;
    sessionStorage.setItem(KUNCI_DRAFT, JSON.stringify({ ...form, kata }));
  }, [form, kata]);

  function bukaForm() {
    setForm({ ...AWAL, name: data?.name || '', npsn: data?.npsn || '', address: data?.address || '' });
    setKata('');
    setHasil([]);
    setCatatan('');
    setPeringatan(false);
  }

  function tutupForm() {
    sessionStorage.removeItem(KUNCI_DRAFT);
    setForm(null);
    setPeringatan(false);
  }

  // Dicari setelah 400 ms berhenti mengetik, minimal 3 huruf — supaya situs
  // referensi tidak dihujani permintaan tiap ketukan tombol.
  function ubahKata(v) {
    setKata(v);
    setPeringatan(false);
    clearTimeout(tunggu);
    if (v.trim().length < 3) {
      setHasil([]);
      setCatatan('Ketik minimal 3 huruf nama sekolah atau NPSN-nya.');
      return;
    }
    setCatatan('Mencari...');
    setTunggu(setTimeout(() => cari(v.trim()), 400));
  }

  async function cari(q) {
    try {
      const r = await api.get(`/ref/sekolah?q=${encodeURIComponent(q)}`, { silent: true });
      const d = r.data.data;
      // NPSN kembar membuat Select menolak render sama sekali.
      const unik = [...new Map(d.hasil.map((s) => [s.npsn, s])).values()];
      setHasil(unik.map((s) => ({ value: s.npsn, label: `${s.nama} — ${s.kecamatan}, ${s.kabkota} (${s.npsn})` })));
      if (!d.total) setCatatan(`Tidak ada sekolah yang cocok. Coba nama lain atau NPSN-nya, atau ${MANUAL.toLowerCase()}`);
      else if (d.terpotong) setCatatan(`Menampilkan ${d.hasil.length} dari ${d.total} hasil. Tambahkan nama kota atau NPSN supaya lebih sempit.`);
      else setCatatan(`${d.total} sekolah ditemukan. Pilih salah satu, atau ${MANUAL.toLowerCase()}`);
    } catch (e) {
      setHasil([]);
      setCatatan(pesanGagal(e));
    }
  }

  async function pilih(npsn) {
    if (!npsn) return;
    setCatatan('Mengambil detail sekolah...');
    try {
      const r = await api.get(`/ref/sekolah/${npsn}`, { silent: true });
      const s = r.data.data;
      setForm((f) => ({ ...f, name: s.nama || f.name, npsn: s.npsn || f.npsn, address: s.alamat_lengkap || f.address }));
      setKata(s.nama);
      // Alamat yang setengah terisi lebih berbahaya daripada pesan galat, karena
      // bisa tersimpan tanpa disadari.
      const kurang = s.wilayah_kurang || [];
      setPeringatan(kurang.length > 0);
      setCatatan(kurang.length
        ? `Terisi dari data referensi, tapi sebagian wilayah tak terbaca: ${kurang.join(', ')}. Periksa dan lengkapi alamatnya dulu sebelum Simpan.`
        : 'Terisi dari data referensi. Periksa dulu, perbaiki kalau perlu, lalu Simpan.');
    } catch (e) {
      setCatatan(pesanGagal(e));
    }
  }

  async function simpan(e) {
    e.preventDefault();
    setSimpanLoading(true);
    try {
      await api.put('/institutions/me', { name: form.name, npsn: form.npsn, address: form.address });
      tutupForm();
      await muatSekolah();
    } catch { /* pesan sudah muncul dari api.js */ } finally { setSimpanLoading(false); }
  }

  return (
    <div>
      <Title order={2} mb="sm">Sekolah</Title>
      <Panduan id="sekolah" steps={PANDUAN} />

      <Paper withBorder shadow="xs" p="md" mb="md">
        {muat ? <Text c="dimmed">Memuat data sekolah...</Text>
          : !data ? <Kosong teks="Data sekolah belum ada." />
            : (
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Group>
                  <Avatar color="teal" size="lg" radius="md">{(data.name || '?').trim()[0].toUpperCase()}</Avatar>
                  <div>
                    <Text size="lg" fw={700}>{data.name}</Text>
                    <Text size="sm" c="dimmed">{data.address || 'Alamat belum diisi'}</Text>
                    <Badge color="teal" mt={4}>NPSN: {data.npsn || '-'}</Badge>
                  </div>
                </Group>
                <Button variant="light" onClick={bukaForm} disabled={!!form}>Ubah data sekolah</Button>
              </Group>
            )}
      </Paper>

      {form && (
        <Paper withBorder shadow="xs" p="md">
          <form onSubmit={simpan}>
            <Title order={4} mb="xs">Cari dari data referensi Kemendikdasmen (opsional)</Title>
            <Select
              label="Cari sekolah"
              placeholder="cth: SMP Negeri 1 Semarang atau 20328861"
              searchable
              // Hasil sudah disaring server. Penyaring bawaan Mantine menuntut
              // tulisan guru sama persis dengan label, jadi hasil asli disembunyikan.
              filter={({ options }) => options}
              data={hasil}
              value={null}
              onChange={pilih}
              searchValue={kata}
              onSearchChange={ubahKata}
              nothingFoundMessage={catatan.startsWith('Mencari') ? 'Mencari...' : 'Belum ada hasil.'}
              mb={4}
            />
            <Text size="xs" mb="md" fw={peringatan ? 600 : 400} style={{ color: peringatan ? '#b45309' : '#64748b' }}>{catatan || 'Ketik minimal 3 huruf, lalu pilih sekolah Anda dari daftar.'}</Text>

            <TextInput label="Nama sekolah" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} mb="sm" />
            <TextInput label="NPSN" value={form.npsn || ''} onChange={(e) => setForm({ ...form, npsn: e.target.value })} mb="sm" />
            <Textarea label="Alamat" autosize minRows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} mb="md" />

            <Group>
              <Button type="submit" loading={simpanLoading}>Simpan</Button>
              <Button variant="outline" onClick={tutupForm}>Batal</Button>
            </Group>
          </form>
        </Paper>
      )}
    </div>
  );
}
