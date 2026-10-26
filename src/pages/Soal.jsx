import { useState } from 'react';
import Panduan from '../components/Panduan';
import PemilihSubbab from '../components/PemilihSubbab';
import Materi from './Materi';
import BankSoal from './BankSoal';

const KUNCI_SUBBAB = 'sigeso_subbab';

function subBabTersimpan() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KUNCI_SUBBAB));
    // Bentuk lama hanya {id, nama} tak bisa mengisi bar pemilih → buang sekali.
    return s && s.grade_level && s.subject_id && s.topic_id && s.chapter_id ? s : null;
  } catch { return null; }
}

// Bank soal: pilih tingkat/mapel/topik/bab/subbab di bar atas, lalu kelola
// materi dan soal subbab itu. Ujian punya halamannya sendiri.
export default function Soal() {
  const [subBab, setSubBab] = useState(subBabTersimpan);

  function pilihSubBab(s) {
    setSubBab(s);
    try {
      if (s) sessionStorage.setItem(KUNCI_SUBBAB, JSON.stringify(s));
      else sessionStorage.removeItem(KUNCI_SUBBAB);
    } catch { /* abaikan */ }
  }

  return (
    <div>
      <Panduan id="bank" steps={[
        'Pilih Tingkat → Mapel → Topik → Bab → Subbab di bar atas. Bar itu tetap terlihat saat halaman digulir.',
        'Tingkat dulu, karena Matematika kelas 4 dan kelas 5 adalah mapel yang berbeda.',
        'Setelah Subbab terpilih, daftar materi muncul. Unggah berkas atau tempel link di sana.',
        'Soal yang sudah ada bisa dicari, diubah, atau dihapus di daftar bawah.',
        'Untuk membuat soal baru, buka halaman Ujian.',
      ]} />
      <PemilihSubbab awal={subBab} onPilih={pilihSubBab} />
      <Materi subBab={subBab} />
      <BankSoal subBab={subBab} />
    </div>
  );
}
