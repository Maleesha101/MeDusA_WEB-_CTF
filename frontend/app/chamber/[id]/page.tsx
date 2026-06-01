"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TempleFrame } from '@/components/TempleFrame';
import { ChallengePanel } from '@/components/ChallengePanel';
import { apiFetch } from '@/lib/api';

export default function ChamberPage() {
  const params = useParams<{ id: string }>();
  const chamberId = Number(params.id);
  const [chamber, setChamber] = useState<any>(null);
  const [hints, setHints] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await apiFetch('/api/me');
        const chamberData = await apiFetch(`/api/chamber/${chamberId}`);
        setChamber(chamberData.chamber);
        const hintData = await apiFetch(`/api/hints?chamberId=${chamberId}`);
        setHints(hintData.hints ?? []);
      } catch {
        window.location.href = '/login';
      }
    })();
  }, [chamberId]);

  if (!chamber) {
    return (
      <TempleFrame title="Entering Chamber" subtitle="loading">
        <p className="text-emerald-100/70">The stones are still shifting.</p>
      </TempleFrame>
    );
  }

  return (
    <TempleFrame title={chamber.name} subtitle={`difficulty / ${chamber.difficulty}`}>
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <article className="medusa-card">
            <p className="medusa-label">Narrative</p>
            <p className="leading-8 text-emerald-100/75">{chamber.description}</p>
            <p className="mt-4 text-sm italic text-emerald-100/55">{chamber.narrative}</p>
          </article>
          <article className="medusa-card">
            <p className="medusa-label">Hints</p>
            <div className="space-y-3 text-sm text-emerald-100/75">
              {hints.map((hint, index) => (
                <div key={index} className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/45">{hint.step}</p>
                  <p className="mt-2">{hint.text}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <ChallengePanel chamberId={chamberId} />
      </div>
    </TempleFrame>
  );
}
