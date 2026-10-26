// Jenjang sekolah dipakai di halaman Kelas (memilih) dan Materi (menyaring tingkat).
export const JENJANG = [
  { value: 'SD', label: 'SD/MI', mulai: 1, sampai: 6 },
  { value: 'SMP', label: 'SMP', mulai: 7, sampai: 9 },
  { value: 'SMA', label: 'SMA', mulai: 10, sampai: 12 },
];

export const labelJenjang = (v) => (JENJANG.find((x) => x.value === v) || {}).label || v || '-';

export const opsiKelas = (jenjang) => {
  const j = JENJANG.find((x) => x.value === jenjang);
  if (!j) return [];
  return Array.from({ length: j.sampai - j.mulai + 1 }, (_, i) => {
    const k = j.mulai + i;
    return { value: String(k), label: `Kelas ${k}` };
  });
};

// Tahun ajaran berganti tiap Juli: Januari–Juni masih tahun ajaran sebelumnya.
const awalTahunAjaran = (() => {
  const d = new Date();
  return d.getFullYear() - (d.getMonth() >= 6 ? 0 : 1);
})();

// Opsi 5 tahun ke belakang sampai tahun depan, urut lama ke baru.
export const TAHUN_AJARAN = Array.from(
  { length: 7 },
  (_, i) => `${awalTahunAjaran - 5 + i}/${awalTahunAjaran - 4 + i}`
);

export const TAHUN_AJARAN_KINI = `${awalTahunAjaran}/${awalTahunAjaran + 1}`;
