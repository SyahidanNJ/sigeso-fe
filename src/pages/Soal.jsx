import { useState } from 'react';
import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import Panduan from '../components/Panduan';
import PemilihSubbab from '../components/PemilihSubbab';
import Materi from './Materi';
import BankSoal from './BankSoal';
import Ujian from './Ujian';

// Materi dan soal satu halaman: pilih subbab di bar atas, lalu materi, generate,
// dan daftar soal. Ujian tetap tab sendiri karena siklusnya lain.
// Tab disimpan di URL agar refresh/bookmark tak membuang posisi.
const TAB = ['soal', 'ujian'];
const KUNCI_SUBBAB = 'sigeso_subbab'; // juga dibaca Ujian.jsx sebagai saringan awal

function subBabTersimpan() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KUNCI_SUBBAB));
    // Bentuk lama hanya {id, nama} tak bisa mengisi bar pemilih → buang sekali.
    return s && s.subject_id && s.grade_level && s.topic_id && s.chapter_id ? s : null;
  } catch { return null; }
}

export default function Soal() {
  const [params, setParams] = useSearchParams();
  const tab = TAB.includes(params.get('tab')) ? params.get('tab') : 'soal';
  const [subBab, setSubBab] = useState(subBabTersimpan);

  function pilihSubBab(s) {
    setSubBab(s);
    try {
      if (s) sessionStorage.setItem(KUNCI_SUBBAB, JSON.stringify(s));
      else sessionStorage.removeItem(KUNCI_SUBBAB);
    } catch { /* abaikan */ }
  }

  return (
    <Tabs
      value={tab}
      onChange={(v) => setParams(v === 'soal' ? {} : { tab: v })}
      keepMounted
      styles={{ tab: { fontWeight: 600, '&[data-active]': { color: 'var(--primer)' } } }}
    >
      <Tabs.List style={{ background: 'var(--kartu)', border: '1px solid var(--garis)', borderRadius: 10, padding: '6px 10px 0', gap: 8 }}>
        <Tabs.Tab value="soal">Materi &amp; Soal</Tabs.Tab>
        <Tabs.Tab value="ujian">Ujian</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="soal" pt="md">
        <Panduan id="bank" steps={[
          'Pilih Mapel → Tingkat → Topik → Bab → Subbab di bar atas. Bar itu tetap terlihat saat halaman digulir.',
          'Setelah Subbab terpilih, daftar materi muncul. Unggah berkas atau tempel link di sana.',
          'Isi jumlah soal, tekan Generate, tunggu sebentar.',
          'Hasilnya dipisah per jenis: Pilihan ganda, Isian singkat, Uraian.',
          'Perbaiki soal lewat Ubah, atau buang lewat Hapus di barisnya.',
        ]} />
        <PemilihSubbab awal={subBab} onPilih={pilihSubBab} />
        <Materi subBab={subBab} />
        <BankSoal subBab={subBab} />
      </Tabs.Panel>
      <Tabs.Panel value="ujian" pt="md">
        <Ujian />
      </Tabs.Panel>
    </Tabs>
  );
}
