import { useState } from 'react';
import { Title } from '@mantine/core';
import PemilihTopik from '../components/PemilihTopik';
import Materi from './Materi';
import BankSoal from './BankSoal';

const KUNCI_TOPIK = 'sigeso_topik';

function topikTersimpan() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KUNCI_TOPIK));
    // Bentuk lama (subbab) tak bisa mengisi bar pemilih → buang sekali.
    return s && s.grade_level && s.subject_id && s.topic_id ? s : null;
  } catch { return null; }
}

// Bank soal: pilih tingkat/mapel/topik di bar atas, lalu kelola materi dan soal
// topik itu. Ujian punya halamannya sendiri.
export default function Soal() {
  const [topik, setTopik] = useState(topikTersimpan);

  function pilihTopik(t) {
    setTopik(t);
    try {
      if (t) sessionStorage.setItem(KUNCI_TOPIK, JSON.stringify(t));
      else sessionStorage.removeItem(KUNCI_TOPIK);
    } catch { /* abaikan */ }
  }

  return (
    <div>
      <Title order={2} mb="sm">Bank soal</Title>
      <PemilihTopik awal={topik} onPilih={pilihTopik} />
      <Materi topik={topik} />
      <BankSoal topik={topik} />
    </div>
  );
}
