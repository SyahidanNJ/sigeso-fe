import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider, { useToast } from './components/Popup';
import { pesanBus } from './lib/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sekolah from './pages/Sekolah';
import Kelas from './pages/Kelas';
import Soal from './pages/Soal';
import Cetak from './pages/Cetak';
import Nilai from './pages/Nilai';
import Profil from './pages/Profil';

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
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sekolah" element={<Sekolah />} />
            <Route path="/kelas" element={<Kelas />} />
            <Route path="/soal" element={<Soal />} />
            <Route path="/materi" element={<Navigate to="/soal" replace />} />
            <Route path="/bank" element={<Navigate to="/soal?tab=soal" replace />} />
            <Route path="/ujian" element={<Navigate to="/soal?tab=ujian" replace />} />
            <Route path="/cetak" element={<Cetak />} />
            <Route path="/nilai" element={<Nilai />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
