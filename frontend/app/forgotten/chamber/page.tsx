import { TempleFrame } from '@/components/TempleFrame';

export default function ForgottenChamberPage() {
  return (
    <TempleFrame title="Forgotten Chamber" subtitle="hidden lore">
      <article className="medusa-card max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold">Treasury echo</h2>
        <p className="leading-8 text-emerald-100/75">The treasury does not merely keep numbers. It records which team asked the wrong question first.</p>
      </article>
    </TempleFrame>
  );
}
