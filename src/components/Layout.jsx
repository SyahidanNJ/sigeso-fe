import { useEffect, useState } from 'react';
import { AppShell, Avatar, Box, Burger, Collapse, Group, Menu, NavLink, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const MENU = [
  { ke: '/', label: 'Dashboard' },
  { ke: '/ujian', label: 'Ujian' },
];

// Menu yang jarang dipakai disembunyikan di balik "Advanced".
const LANJUTAN = [
  { ke: '/soal', label: 'Bank Soal' },
  { ke: '/sekolah', label: 'Sekolah' },
];

const PERAN = { superadmin: 'Super Admin', admin: 'Admin', guru: 'Guru' };
const LEBAR_NAVBAR = 230;

// Bergantian di header; panjangnya dijaga seragam agar tata letak tak bergeser.
const KATA = [
  'Buat soal ujian semakin mudah',
  'Dari materi langsung jadi soal',
  'Satu lembar soal, fotokopi sendiri',
  'Setujui soal, cetak, selesai',
];

export default function Layout() {
  const nav = useNavigate();
  const lok = useLocation();
  const [buka, { toggle }] = useDisclosure();
  const [lanjut, setLanjut] = useState(() => LANJUTAN.some((m) => m.ke === lok.pathname));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sigeso_user')) || null; } catch { return null; }
  });

  const [kata, setKata] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKata((v) => (v + 1) % KATA.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Pindah ke menu di luar Advanced menutupnya, supaya submenu tak menggantung
  // terbuka saat guru pindah tab.
  useEffect(() => {
    if (!LANJUTAN.some((m) => m.ke === lok.pathname)) setLanjut(false);
  }, [lok.pathname]);

  // Header ikut berubah saat nama atau kelas diganti dari halaman Profil.
  useEffect(() => {
    const muat = () => api.get('/auth/me').then((r) => setUser(r.data.data)).catch(() => {});
    muat();
    window.addEventListener('sigeso:user', muat);
    return () => window.removeEventListener('sigeso:user', muat);
  }, []);

  function keluar() {
    localStorage.removeItem('sigeso_token');
    localStorage.removeItem('sigeso_user');
    nav('/login');
  }

  const nama = user?.name || 'Pengguna';
  const peran = PERAN[user?.role] || 'Guru';
  const admin = ['superadmin', 'admin'].includes(user?.role);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: LEBAR_NAVBAR, breakpoint: 'sm', collapsed: { mobile: !buka } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={buka} onClick={toggle} hiddenFrom="sm" size="sm" />
            {/* Area logo dibuat selebar navbar (dikurangi padding header + jarak
                antar item) supaya garis pemisah tagline sejajar tepi navbar. */}
            <Box w={{ base: 'auto', md: LEBAR_NAVBAR - 16 - 8 }} style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/sigeso-logo.svg" alt="Sigeso" height={40} style={{ cursor: 'pointer' }} onClick={() => nav('/')} />
            </Box>
            <Text
              key={kata}
              className="kata-masuk"
              size="sm"
              c="dimmed"
              visibleFrom="md"
              style={{ borderLeft: '1px solid var(--garis)', paddingLeft: 14, minWidth: 250 }}
            >
              {KATA[kata]}
            </Text>
          </Group>
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs" wrap="nowrap">
                  <Avatar color="teal" radius="xl" size="sm">{nama[0].toUpperCase()}</Avatar>
                  <div style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} lh={1.2} truncate maw={{ base: 110, sm: 220 }}>{nama}</Text>
                    <Text size="xs" c="dimmed" lh={1.2} truncate maw={{ base: 110, sm: 220 }}>
                      {user?.class_name || peran}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{nama} — {peran}</Menu.Label>
              <Menu.Item onClick={() => nav('/profil')}>Profil</Menu.Item>
              {admin && <Menu.Item onClick={() => nav('/pengguna')}>Pengguna</Menu.Item>}
              <Menu.Divider />
              <Menu.Item color="red" onClick={keluar}>Keluar</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {MENU.map((m) => (
          <NavLink key={m.ke} label={m.label} active={lok.pathname === m.ke} onClick={() => nav(m.ke)} />
        ))}
        <NavLink
          label="Advanced"
          mt={4}
          opened={lanjut}
          onClick={() => setLanjut((v) => !v)}
          active={LANJUTAN.some((m) => m.ke === lok.pathname)}
          rightSection={
            // Mantine sudah memutar rightSection 90° saat terbuka: kanan → bawah.
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          }
        />
        <Collapse in={lanjut}>
          {LANJUTAN.map((m) => (
            <NavLink key={m.ke} label={m.label} pl="lg" active={lok.pathname === m.ke} onClick={() => nav(m.ke)} />
          ))}
        </Collapse>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
