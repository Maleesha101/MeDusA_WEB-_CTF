import { TempleFrame } from '@/components/TempleFrame';

export default function AthenaJournalPage() {
  return (
    <TempleFrame title="Athena Journal" subtitle="hidden lore">
      <article className="medusa-card max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold">Mirror notes</h2>
        <p className="leading-8 text-emerald-100/75">The mirror only filters obvious reflection. Redirects and strange hosts are left to the patient.</p>
      </article>
    </TempleFrame>
  );
}
