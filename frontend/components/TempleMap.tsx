"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export type ChamberView = {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  order_index: number;
  enabled: boolean;
  solved: boolean;
  narrative: string;
};

export function TempleMap({ chambers }: { chambers: ChamberView[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {chambers.map((chamber, index) => (
        <motion.article
          key={chamber.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className={`medusa-card relative overflow-hidden ${chamber.solved ? 'border-emerald-300/40' : ''}`}
        >
          <div className="absolute inset-0 temple-rune opacity-60" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-emerald-200/55">Chamber {chamber.order_index}</p>
                <h3 className="mt-2 text-xl font-semibold text-emerald-50">{chamber.name}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${chamber.solved ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100' : chamber.enabled ? 'border-lime-300/20 bg-lime-300/10 text-lime-100' : 'border-white/10 bg-white/5 text-white/50'}`}>
                {chamber.solved ? 'Solved' : chamber.enabled ? 'Open' : 'Locked'}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-emerald-100/70">{chamber.description}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-emerald-200/45">{chamber.difficulty}</p>
            <p className="mt-3 text-sm italic text-emerald-50/60">{chamber.narrative}</p>
            <div className="mt-6 flex items-center justify-between gap-3">
              <Link className="medusa-button" href={`/chamber/${chamber.id}`}>Enter chamber</Link>
              <span className="text-[11px] uppercase tracking-[0.28em] text-emerald-100/40">{chamber.solved ? 'Glowing' : 'Unbroken'}</span>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
