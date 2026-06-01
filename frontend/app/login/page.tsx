"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TempleFrame } from '@/components/TempleFrame';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('Aegis');
  const [password, setPassword] = useState('team-aegis');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ name, password })
      });
      router.push('/dashboard');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TempleFrame title="Team Login" subtitle="team-based authentication">
      <div className="mx-auto max-w-xl space-y-6">
        <p className="text-sm leading-7 text-emerald-100/70">Use your team credentials to enter the temple. Each team has isolated progress and score tracking.</p>
        <div className="medusa-card space-y-4">
          <div>
            <label className="medusa-label">Team Name</label>
            <input className="medusa-input" value={name} onChange={event => setName(event.target.value)} />
          </div>
          <div>
            <label className="medusa-label">Password</label>
            <input className="medusa-input" type="password" value={password} onChange={event => setPassword(event.target.value)} />
          </div>
          <button className="medusa-button" onClick={login} disabled={busy}>{busy ? 'Entering...' : 'Enter Temple'}</button>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </div>
    </TempleFrame>
  );
}
