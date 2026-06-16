import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('mirror subdomain of blocked host is allowed', async () => {
  const team = await loginTeam('Hydra', 'team-hydra');
  const result = await requestJson('/api/mirror/fetch', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({ url: 'http://127.0.0.1.nip.io:4000/healthz' })
  });

  assert.equal(result.response.status, 200, `Subdomain bypass should be allowed: ${result.text}`);
});
