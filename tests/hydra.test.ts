import crypto from 'node:crypto';
import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('hydra challenge keeps the redemption race open', async () => {
  const team = await loginTeam('Helios', 'team-helios');
  const claimKey = `claim-${crypto.randomUUID()}`;

  const attempts = await Promise.all(
    Array.from({ length: 6 }, () => requestJson<{ ok: boolean; reward?: string; flag?: string; message: string }>('/api/hydra/redeem', {
      method: 'POST',
      headers: teamHeaders(team.token),
      body: JSON.stringify({ claimKey })
    }))
  );

  const successCount = attempts.filter(attempt => attempt.response.status === 200 && (attempt.body as { ok: boolean }).ok).length;

  assert.ok(successCount >= 2, `Expected the TOCTOU window to allow multiple successful redemptions, saw ${successCount}`);
  assert.ok(attempts.some(attempt => attempt.response.status === 200 && (attempt.body as { reward?: string }).reward === 'archive_import_token'), 'Hydra should still return the archive-import reward');

  const chamber = await requestJson('/api/chamber/4', {
    headers: teamHeaders(team.token)
  });

  assert.equal(chamber.response.status, 200, 'Hydra chamber detail should be reachable');
});