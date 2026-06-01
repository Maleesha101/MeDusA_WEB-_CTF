"use client";

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

export function ChallengePanel({ chamberId }: { chamberId: number }) {
  const [output, setOutput] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const kind = useMemo(() => chamberId, [chamberId]);

  async function submitFlag() {
    setBusy(true);
    try {
      const result = await apiFetch('/api/submit-flag', {
        method: 'POST',
        body: JSON.stringify({ chamberId, flag: form.flag ?? '' })
      });
      setOutput(result.message ?? 'Submitted');
    } catch (error) {
      setOutput((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="medusa-card">
        <h3 className="text-lg font-semibold text-emerald-100">Flag Submission</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input className="medusa-input" placeholder="flag{...}" value={form.flag ?? ''} onChange={event => setForm(previous => ({ ...previous, flag: event.target.value }))} />
          <button className="medusa-button" disabled={busy} onClick={submitFlag}>{busy ? 'Submitting...' : 'Submit'}</button>
        </div>
        {output ? <p className="mt-3 text-sm text-emerald-100/75">{output}</p> : null}
      </section>

      {kind === 1 ? (
        <TreasuryPanel form={form} setForm={setForm} setOutput={setOutput} />
      ) : kind === 2 ? (
        <MirrorPanel form={form} setForm={setForm} setOutput={setOutput} />
      ) : kind === 3 ? (
        <OraclePanel form={form} setForm={setForm} setOutput={setOutput} />
      ) : kind === 4 ? (
        <HydraPanel form={form} setForm={setForm} setOutput={setOutput} />
      ) : kind === 5 ? (
        <ArchivePanel form={form} setForm={setForm} setOutput={setOutput} />
      ) : kind === 6 ? (
        <WhispersPanel form={form} setForm={setForm} setOutput={setOutput} />
      ) : (
        <CorePanel form={form} setForm={setForm} setOutput={setOutput} />
      )}
    </div>
  );
}

function TreasuryPanel({ form, setForm, setOutput }: any) {
  async function loadTransaction() {
    try {
      const result = await apiFetch(`/api/treasury/transactions/${form.transactionId ?? '1'}`);
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  async function addComment() {
    try {
      const result = await apiFetch(`/api/treasury/transactions/${form.transactionId ?? '1'}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body: form.comment ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  async function loadReport() {
    try {
      const result = await apiFetch('/api/treasury/audit/report');
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Treasury Operations</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="medusa-input" placeholder="transaction id" value={form.transactionId ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, transactionId: event.target.value }))} />
        <input className="medusa-input" placeholder="comment" value={form.comment ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, comment: event.target.value }))} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="medusa-button-ghost" onClick={loadTransaction}>View transaction</button>
        <button className="medusa-button-ghost" onClick={addComment}>Add comment</button>
        <button className="medusa-button-ghost" onClick={loadReport}>Run audit report</button>
      </div>
    </section>
  );
}

function MirrorPanel({ form, setForm, setOutput }: any) {
  async function fetchTarget() {
    try {
      const result = await apiFetch('/api/mirror/fetch', {
        method: 'POST',
        body: JSON.stringify({ url: form.targetUrl ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Mirror Fetch</h3>
      <input className="medusa-input" placeholder="https://example.com" value={form.targetUrl ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, targetUrl: event.target.value }))} />
      <button className="medusa-button-ghost" onClick={fetchTarget}>Mirror target</button>
    </section>
  );
}

function OraclePanel({ form, setForm, setOutput }: any) {
  async function renderProphecy() {
    try {
      const result = await apiFetch('/api/oracle/prophecy', {
        method: 'POST',
        body: JSON.stringify({ name: form.name ?? '', temple: form.temple ?? '', message: form.message ?? '' })
      });
      setOutput(result.rendered);
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  async function evaluate() {
    try {
      const result = await apiFetch('/api/oracle/evaluate', {
        method: 'POST',
        body: JSON.stringify({ snippet: form.snippet ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Prophecy Engine</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <input className="medusa-input" placeholder="name" value={form.name ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, name: event.target.value }))} />
        <input className="medusa-input" placeholder="temple" value={form.temple ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, temple: event.target.value }))} />
        <input className="medusa-input" placeholder="message" value={form.message ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, message: event.target.value }))} />
      </div>
      <textarea className="medusa-input min-h-28" placeholder="snippet" value={form.snippet ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, snippet: event.target.value }))} />
      <div className="flex gap-3">
        <button className="medusa-button-ghost" onClick={renderProphecy}>Render prophecy</button>
        <button className="medusa-button-ghost" onClick={evaluate}>Evaluate snippet</button>
      </div>
    </section>
  );
}

function HydraPanel({ form, setForm, setOutput }: any) {
  async function redeem() {
    try {
      const result = await apiFetch('/api/hydra/redeem', {
        method: 'POST',
        body: JSON.stringify({ claimKey: form.claimKey ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Hydra Gate Redeemer</h3>
      <input className="medusa-input" placeholder="claim key" value={form.claimKey ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, claimKey: event.target.value }))} />
      <button className="medusa-button-ghost" onClick={redeem}>Redeem in parallel</button>
    </section>
  );
}

function ArchivePanel({ form, setForm, setOutput }: any) {
  async function importArchive() {
    try {
      const result = await apiFetch('/api/archive/import', {
        method: 'POST',
        body: JSON.stringify({ payload: form.payload ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Serpent Archive Import</h3>
      <textarea className="medusa-input min-h-28" placeholder="base64 archive payload" value={form.payload ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, payload: event.target.value }))} />
      <button className="medusa-button-ghost" onClick={importArchive}>Import profile</button>
    </section>
  );
}

function WhispersPanel({ form, setForm, setOutput }: any) {
  async function postMessage() {
    try {
      const result = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ username: form.username ?? 'oracle', message: form.message ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  async function runBot() {
    try {
      const result = await apiFetch('/api/chat/bot', { method: 'POST', body: JSON.stringify({}) });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Gorgon Whispers Chat</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="medusa-input" placeholder="username" value={form.username ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, username: event.target.value }))} />
        <input className="medusa-input" placeholder="message" value={form.message ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, message: event.target.value }))} />
      </div>
      <div className="flex gap-3">
        <button className="medusa-button-ghost" onClick={postMessage}>Post chat message</button>
        <button className="medusa-button-ghost" onClick={runBot}>Trigger admin bot</button>
      </div>
    </section>
  );
}

function CorePanel({ form, setForm, setOutput }: any) {
  async function loadArtifacts() {
    try {
      const result = await apiFetch('/api/core/artifacts');
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  async function unseal() {
    try {
      const result = await apiFetch('/api/core/unseal', {
        method: 'POST',
        body: JSON.stringify({ accessKey: form.accessKey ?? '' })
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((error as Error).message);
    }
  }

  return (
    <section className="medusa-card space-y-3">
      <h3 className="text-lg font-semibold">Medusa Core</h3>
      <textarea className="medusa-input min-h-24" placeholder="combined access key" value={form.accessKey ?? ''} onChange={event => setForm((previous: any) => ({ ...previous, accessKey: event.target.value }))} />
      <div className="flex gap-3">
        <button className="medusa-button-ghost" onClick={loadArtifacts}>Load artifacts</button>
        <button className="medusa-button-ghost" onClick={unseal}>Unseal core</button>
      </div>
    </section>
  );
}
