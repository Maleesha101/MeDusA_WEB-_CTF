import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('mirror challenge stays reachable and SSRF-prone', async () => {
  const team = await loginTeam('Hydra', 'team-hydra');

  const blocked = await requestJson('/api/mirror/fetch', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({ url: 'http://localhost:4000/api/meta' })
  });

  assert.equal(blocked.response.status, 400, 'Mirror should still block naive localhost inputs');

  const bypass = await requestJson<{ status: number; contentType: string; body: string }>('/api/mirror/fetch', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({ url: 'http://127.0.0.1.nip.io:4000/healthz' })
  });

  assert.equal(bypass.response.status, 200, `Mirror bypass should remain reachable: ${bypass.text}`);
  assert.equal((bypass.body as { status: number }).status, 200);
  assert.match((bypass.body as { body: string }).body, /medusa-backend/i);

  const chamber = await requestJson('/api/chamber/2', {
    headers: teamHeaders(team.token)
  });

  assert.equal(chamber.response.status, 200, 'Mirror chamber detail should be reachable');
});