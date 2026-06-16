import { test } from 'node:test';
import { assert, assertAdminChambersIntact, loginTeam, requestJson, signAdminSession, teamCookieHeaders, teamHeaders } from './helpers.js';

test('core challenge remains sealable and the organizer catalog is intact', async () => {
  const team = await loginTeam('Helios', 'team-helios');

  const artifacts = await requestJson<{ treasury: string; mirror: string; oracle: string; hydra: string; archive: string; whispers: string }>('/api/core/artifacts', {
    headers: teamHeaders(team.token)
  });

  assert.equal(artifacts.response.status, 200, `Core artifacts endpoint should remain reachable: ${artifacts.text}`);

  const expectedArtifacts = {
    treasury: `audit_${team.id}_credential`,
    mirror: `mirror_${team.id}_secret`,
    oracle: `oracle_${team.id}_token`,
    hydra: `hydra_${team.id}_archive`,
    archive: `archive_${team.id}_master`,
    whispers: `whispers_${team.id}_core`
  };

  assert.deepEqual(artifacts.body, expectedArtifacts, 'Core artifacts should remain obtainable and ordered correctly');

  const sealed = await requestJson<{ flag: string }>('/api/core/unseal', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({ accessKey: Object.values(expectedArtifacts).join(':') })
  });

  assert.equal(sealed.response.status, 200, `Core unseal should remain reachable: ${sealed.text}`);
  assert.equal((sealed.body as { flag: string }).flag, 'flag{medusa_core_static}');

  const legacyBridge = await requestJson<{ mirrorApiKey: string; flag: string }>('/api/legacy/admin-portal', {
    headers: {
      ...teamCookieHeaders(team.token),
      authorization: `Bearer ${signAdminSession()}`
    }
  });

  assert.equal(legacyBridge.response.status, 200, `Legacy bridge should remain reachable for organizers: ${legacyBridge.text}`);
  assert.equal((legacyBridge.body as { mirrorApiKey: string }).mirrorApiKey, `mirror-api-${team.id}-credential`);
  assert.equal((legacyBridge.body as { flag: string }).flag, 'flag{treasury_of_venom_static}');

  await assertAdminChambersIntact();
});