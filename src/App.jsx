import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider, { useToast } from './components/Popup';
import { pesanBus } from './lib/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import LupaSandi from './pages/LupaSandi';
import ResetSandi from './pages/ResetSandi';
import Dashboard from './pages/Dashboard';
import Sekolah from './pages/Sekolah';
import Soal from './pages/Soal';
import Ujian from './pages/Ujian';
import Profil from './pages/Profil';
import Pengguna from './pages/Pengguna';

function Daftarkan() {
  pesanBus.dorong = useToast();
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Daftarkan />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lupa-sandi" element={<LupaSandi />} />
          <Route path="/reset-sandi" element={<ResetSandi />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ujian" element={<Ujian />} />
            <Route path="/soal" element={<Soal />} />
            <Route path="/sekolah" element={<Sekolah />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/pengguna" element={<Pengguna />} />
            {/* Alamat lama tetap hidup supaya tautan/bookmark tak jadi 404. */}
            <Route path="/materi" element={<Navigate to="/soal" replace />} />
            <Route path="/bank" element={<Navigate to="/soal" replace />} />
            <Route path="/cetak" element={<Navigate to="/ujian" replace />} />
            <Route path="/nilai" element={<Navigate to="/" replace />} />
            <Route path="/kelas" element={<Navigate to="/profil" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
