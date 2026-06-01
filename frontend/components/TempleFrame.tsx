"use client";

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function TempleFrame({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode; }) {
  return (
    <div className="min-h-screen text-emerald-50">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-16 top-12 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-lime-500/10 blur-3xl"
          animate={{ x: [0, -24, 0], y: [0, 26, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-temple-grid bg-[length:48px_48px] opacity-20" />
      </div>

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-10">
        <div>
          <a href="/" className="medusa-title text-lg font-bold uppercase tracking-[0.42em] text-emerald-100">
            Medusa Temple
          </a>
          {subtitle ? <p className="mt-1 text-xs uppercase tracking-[0.32em] text-emerald-200/60">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a className="medusa-button-ghost" href="/dashboard">Temple Map</a>
          <a className="medusa-button-ghost" href="/login">Login</a>
          <a className="medusa-button-ghost" href="/admin">Admin</a>
          {actions}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10">
        <div className="medusa-shell p-6 md:p-10">
          <div className="mb-8 flex flex-col gap-4 border-b border-emerald-400/10 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="medusa-title text-xs uppercase tracking-[0.45em] text-emerald-200/50">Medusa: The Forbidden Temple</p>
              <h1 className="mt-4 text-4xl font-bold md:text-6xl">{title}</h1>
            </div>
            <div className="max-w-xl text-sm leading-7 text-emerald-100/70">
              Ancient marble, broken neon, and every chamber asking a different question.
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
