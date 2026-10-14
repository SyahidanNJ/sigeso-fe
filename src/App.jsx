import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sekolah from './pages/Sekolah';
import Kelas from './pages/Kelas';
import Materi from './pages/Materi';
import BankSoal from './pages/BankSoal';
import Ujian from './pages/Ujian';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sekolah" element={<Sekolah />} />
            <Route path="/kelas" element={<Kelas />} />
            <Route path="/materi" element={<Materi />} />
            <Route path="/bank" element={<BankSoal />} />
            <Route path="/ujian" element={<Ujian />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
