import { useState } from 'react';
import api from '../lib/api';

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [llm, setLlm] = useState('');
  const [loading, setLoading] = useState(false);
  async function cek() {
    setLoading(true);
    try {
      const h = await api.get('/health');
      setHealth(h.data.data);
      const t = await api.post('/llm/test', {});
      setLlm(`LLM OK: ${t.data.data.reply} (${t.data.data.duration_ms}ms) · ${t.data.requestId}`);
    } catch (e) {
      setLlm(e.userMessage || e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ maxWidth: 640, margin: '40px auto' }}>
      <h1>Sigeso — Dashboard</h1>
      <button onClick={cek} disabled={loading}>{loading ? 'Mengecek...' : 'Cek backend + LLM'}</button>
      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
      {llm && <p>{llm}</p>}
      <p><a href="/login">Login</a></p>
    </div>
  );
}
