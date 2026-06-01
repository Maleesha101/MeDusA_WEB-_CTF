"use client";

import { useEffect, useState } from 'react';
import { TempleFrame } from '@/components/TempleFrame';
import { TempleMap, type ChamberView } from '@/components/TempleMap';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const [chambers, setChambers] = useState<ChamberView[]>([]);
  const [scoreboard, setScoreboard] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch('/api/me');
        setTeam(me.team);
        const chamberData = await apiFetch('/api/chambers');
        setChambers(chamberData.chambers);
        setScoreboard(await apiFetch('/api/scoreboard'));
      } catch {
        window.location.href = '/login';
      }
    })();
  }, []);

  return (
    <TempleFrame title="Temple Map" subtitle="dashboard / progression / scoreboard">
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="medusa-card">
            <p className="medusa-label">Team</p>
            <p className="text-xl font-semibold">{team?.name ?? 'Loading...'}</p>
          </article>
          <article className="medusa-card">
            <p className="medusa-label">Score</p>
            <p className="text-xl font-semibold">{team?.score ?? 0}</p>
          </article>
          <article className="medusa-card">
            <p className="medusa-label">Manual Submission</p>
            <a href="/chamber/1" className="medusa-button mt-1">Open first chamber</a>
          </article>
        </section>

        <section>
          <h2 className="medusa-title mb-4 text-xs uppercase tracking-[0.45em] text-emerald-200/50">Chambers</h2>
          <TempleMap chambers={chambers} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="medusa-card">
            <h2 className="text-lg font-semibold">Scoreboard</h2>
            <div className="mt-4 space-y-3 text-sm">
              {scoreboard?.teams?.map((entry: any, index: number) => (
                <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/25 px-4 py-3">
                  <span className="flex items-center gap-3"><span className="text-emerald-200/50">#{index + 1}</span> {entry.name}</span>
                  <span>{entry.score} pts / {entry.solves} solves</span>
                </div>
              ))}
            </div>
          </article>

          <article className="medusa-card">
            <h2 className="text-lg font-semibold">First Blood</h2>
            <div className="mt-4 space-y-3 text-sm text-emerald-100/75">
              {scoreboard?.firstBlood?.map((entry: any) => (
                <div key={`${entry.team_id}-${entry.chamber_id}`} className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
                  Chamber {entry.chamber_id} was first solved by team {entry.team_id}.
                </div>
              )) ?? <p>Loading...</p>}
            </div>
          </article>
        </section>
      </div>
    </TempleFrame>
  );
}
