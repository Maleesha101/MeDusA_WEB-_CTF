import { TempleFrame } from '@/components/TempleFrame';

export default function LandingPage() {
  return (
    <TempleFrame title="The Forbidden Temple Awakes" subtitle="lore / access / beginning">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <section className="space-y-6">
          <p className="max-w-3xl text-lg leading-8 text-emerald-100/75">
            The temple beneath the neon ruins is older than the network that tries to contain it. Seven chambers wait inside: treasury, mirror, oracle, gate, archive, whispers, and the core.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="medusa-button" href="/login">Enter the temple</a>
            <a className="medusa-button-ghost" href="/dashboard">Temple map</a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Static flags', 'Every environment uses the same fixed flags.'],
              ['Team sessions', 'Players authenticate as teams and score independently.'],
              ['Chained exploits', 'Each chamber teaches a real attack path, not a toy switch.']
            ].map(([title, body]) => (
              <article key={title} className="medusa-card">
                <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-100">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-emerald-100/70">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="medusa-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-lime-300/10" />
          <div className="relative space-y-4">
            <p className="medusa-title text-xs uppercase tracking-[0.45em] text-emerald-200/50">Forbidden Knowledge</p>
            <h2 className="text-3xl font-bold">Medusa watches the map.</h2>
            <p className="leading-7 text-emerald-100/70">
              The challenge chain rewards patience, enumeration, and the ability to turn one leak into the next exploit.
            </p>
            <div className="rounded-2xl border border-emerald-400/15 bg-black/30 p-4 text-sm text-emerald-100/70">
              <p className="uppercase tracking-[0.28em] text-emerald-200/45">First team artifacts</p>
              <ul className="mt-3 space-y-2">
                <li>Treasury IDOR plus second-order SQL injection.</li>
                <li>Mirror SSRF bypass into hidden internal services.</li>
                <li>Oracle SSTI and sandbox escape into file disclosure.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </TempleFrame>
  );
}
