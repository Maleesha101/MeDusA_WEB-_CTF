import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('archive challenge still evaluates imported payloads', async () => {
  const team = await loginTeam('Aegis', 'team-aegis');

  const payload = 'typeof file';
  const archive = await requestJson<{ result: string; decoded: string }>('/api/archive/import', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({
      payload: Buffer.from(payload).toString('base64')
    })
  });

  assert.equal(archive.response.status, 200, `Archive import should remain reachable: ${archive.text}`);
  assert.equal((archive.body as { result: string }).result, 'function');
  assert.equal((archive.body as { decoded: string }).decoded, payload);

  const chamber = await requestJson('/api/chamber/5', {
    headers: teamHeaders(team.token)
  });

  assert.equal(chamber.response.status, 200, 'Archive chamber detail should be reachable');
});