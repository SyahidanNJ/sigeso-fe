import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './styles.css';
import App from './App';
import { tema } from './tema';

createRoot(document.getElementById('root')).render(
  <MantineProvider theme={tema}>
    <App />
  </MantineProvider>
);
