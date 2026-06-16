import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('oracle challenge still exposes template and sandbox behavior', async () => {
  const team = await loginTeam('Orion', 'team-orion');
  const expectedAdminEmail = process.env.ADMIN_EMAIL ?? 'oracle@medusa.ctf';

  const prophecy = await requestJson<{ rendered: string }>('/api/oracle/prophecy', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({
      name: 'Oracle Runner',
      temple: 'Medusa',
      message: '<%= process.env.ADMIN_EMAIL %>'
    })
  });

  assert.equal(prophecy.response.status, 200, `Oracle prophecy should remain reachable: ${prophecy.text}`);
  assert.equal((prophecy.body as { rendered: string }).rendered, expectedAdminEmail);

  const evaluation = await requestJson<{ result: string; sandbox: string }>('/api/oracle/evaluate', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({ snippet: 'hint.team' })
  });

  assert.equal(evaluation.response.status, 200, `Oracle sandbox evaluation should remain reachable: ${evaluation.text}`);
  assert.equal((evaluation.body as { result: string }).result, 'Orion');

  const chamber = await requestJson('/api/chamber/3', {
    headers: teamHeaders(team.token)
  });

  assert.equal(chamber.response.status, 200, 'Oracle chamber detail should be reachable');
});