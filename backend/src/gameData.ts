export type ChamberHint = {
  step: string;
  text: string;
};

export const chamberHints: Record<number, ChamberHint[]> = {
  1: [
    { step: 'recon', text: 'Transactions leak across team boundaries if you enumerate ids carefully.' },
    { step: 'chain', text: 'One comment is not enough; let the treasury staff reuse your words in their own report.' },
    { step: 'final', text: 'The old public key still trusts the wrong algorithm.' }
  ],
  2: [
    { step: 'recon', text: 'The mirror follows redirects more eagerly than it should.' },
    { step: 'chain', text: 'Find the hidden admin token by looking through treasury output.' },
    { step: 'final', text: 'Internal panels often speak only to trusted hostnames.' }
  ],
  3: [
    { step: 'recon', text: 'Filter lists are fingerprints, not defenses.' },
    { step: 'chain', text: 'Traversal into the object graph reveals more than plain strings.' },
    { step: 'final', text: 'The prophecy engine trusts a sandbox that can be escaped.' }
  ],
  4: [
    { step: 'recon', text: 'Race conditions need concurrency, not curiosity.' },
    { step: 'chain', text: 'Inventory and wallet updates happen at different speeds.' },
    { step: 'final', text: 'Parallel redemption opens the gate.' }
  ],
  5: [
    { step: 'recon', text: 'The archive format is custom only on the surface.' },
    { step: 'chain', text: 'The sandbox blocks obvious commands, but not object constructors.' },
    { step: 'final', text: 'The master key sits behind the escape hatch.' }
  ],
  6: [
    { step: 'recon', text: 'Sanitizers often miss non-script execution paths.' },
    { step: 'chain', text: 'The bot trusts rendered HTML more than it should.' },
    { step: 'final', text: 'The dashboard leaks one token if the bot can be driven.' }
  ],
  7: [
    { step: 'recon', text: 'The final access ritual accepts every artifact collected before it.' },
    { step: 'chain', text: 'The hidden maintenance terminal combines old secrets into one key.' },
    { step: 'final', text: 'Only one code path turns lore into the final flag.' }
  ]
};

export const chamberNarrative: Record<number, string> = {
  1: 'A treasury ledger hums beneath cracked marble, counting souls as if they were coins.',
  2: 'The mirror does not show the world; it shows what the world is trying to hide.',
  3: 'The oracle answers in stone, but every answer has a second meaning.',
  4: 'The gate rewards haste and punishes certainty. The fastest hand is rarely the safest.',
  5: 'The archive remembers too much and validates too little.',
  6: 'Whispers travel faster than moderation when the walls are made of glass.',
  7: 'The core waits for every earlier secret to be spoken in the right order.'
};
