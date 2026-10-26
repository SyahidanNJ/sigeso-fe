# sigeso-fe

Frontend Sigeso (React 18 + Vite 5, CSS vanilla).

## Jalan lokal

1. `copy .env.example .env` (opsional; default `http://localhost:3001/api/v1`)
2. `npm install` → `npm run dev` → buka `http://localhost:5173`
3. Login dulu (`/login`), token tersimpan di localStorage.

Halaman: Dashboard, Profil, Sekolah, Materi (+sumber), Bank Soal, Ujian,
Pengguna. Alurnya satu lembar per kelas: buat ujian → setujui soal → cetak
soal dan kunci.
