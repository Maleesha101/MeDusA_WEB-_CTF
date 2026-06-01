"use client";

import { useEffect, useState } from 'react';
import { TempleFrame } from '@/components/TempleFrame';
import { apiFetch } from '@/lib/api';

export default function AdminPage() {
  const [email, setEmail] = useState('oracle@medusa.ctf');
  const [password, setPassword] = useState('change-me-now');
  const [payload, setPayload] = useState<any>(null);
  const [mode, setMode] = useState<'login' | 'dashboard'>('login');

  async function login() {
    await apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setMode('dashboard');
    refresh();
  }

  async function refresh() {
    const [teams, solves, scoreboard, traffic, chambers] = await Promise.all([
      apiFetch('/api/admin/teams'),
      apiFetch('/api/admin/solves'),
      apiFetch('/api/admin/scoreboard'),
      apiFetch('/api/admin/traffic'),
      apiFetch('/api/admin/chambers')
    ]);
    setPayload({ teams, solves, scoreboard, traffic, chambers });
  }

  async function toggleChamber(id: number) {
    await apiFetch(`/api/admin/chambers/${id}/toggle`, { method: 'POST', body: JSON.stringify({}) });
    refresh();
  }

  useEffect(() => {
    refresh()
      .then(() => setMode('dashboard'))
      .catch(() => setMode('login'));
  }, []);

  return (
    <TempleFrame title="Admin Dashboard" subtitle="organizer / control / monitoring">
      {mode === 'login' ? (
        <div className="mx-auto max-w-xl space-y-4 medusa-card">
          <div>
            <label className="medusa-label">Admin Email</label>
            <input className="medusa-input" value={email} onChange={event => setEmail(event.target.value)} />
          </div>
          <div>
            <label className="medusa-label">Password</label>
            <input className="medusa-input" type="password" value={password} onChange={event => setPassword(event.target.value)} />
          </div>
          <button className="medusa-button" onClick={login}>Enter admin console</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <button className="medusa-button-ghost" onClick={refresh}>Refresh</button>
          </div>
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="medusa-card">
              <h2 className="text-lg font-semibold">Teams</h2>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-emerald-100/70">{JSON.stringify(payload?.teams, null, 2)}</pre>
            </article>
            <article className="medusa-card">
              <h2 className="text-lg font-semibold">Solves</h2>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-emerald-100/70">{JSON.stringify(payload?.solves, null, 2)}</pre>
            </article>
            <article className="medusa-card">
              <h2 className="text-lg font-semibold">Traffic</h2>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-emerald-100/70">{JSON.stringify(payload?.traffic, null, 2)}</pre>
            </article>
            <article className="medusa-card">
              <h2 className="text-lg font-semibold">Chambers</h2>
              <div className="mt-4 space-y-3">
                {payload?.chambers?.chambers?.map((chamber: any) => (
                  <div key={chamber.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 px-4 py-3 text-sm">
                    <span>{chamber.name} {chamber.enabled ? '(enabled)' : '(disabled)'}</span>
                    <button className="medusa-button-ghost py-2 text-xs" onClick={() => toggleChamber(chamber.id)}>
                      Toggle
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      )}
    </TempleFrame>
  );
}
