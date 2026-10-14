import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider, { useToast } from './components/Popup';
import { pesanBus } from './lib/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sekolah from './pages/Sekolah';
import Kelas from './pages/Kelas';
import Materi from './pages/Materi';
import BankSoal from './pages/BankSoal';
import Ujian from './pages/Ujian';
import Cetak from './pages/Cetak';
import Nilai from './pages/Nilai';

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
            <Route path="/materi" element={<Materi />} />
            <Route path="/bank" element={<BankSoal />} />
            <Route path="/ujian" element={<Ujian />} />
            <Route path="/cetak" element={<Cetak />} />
            <Route path="/nilai" element={<Nilai />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
