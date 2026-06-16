import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('treasury challenge stays reachable and vulnerable', async () => {
  const aegis = await loginTeam('Aegis', 'team-aegis');
  const hydra = await loginTeam('Hydra', 'team-hydra');

  const chambers = await requestJson('/api/chambers', {
    headers: teamHeaders(aegis.token)
  });

  assert.equal(chambers.response.status, 200, `Treasury route should be reachable: ${chambers.text}`);

  const lookup = await requestJson('/api/chamber/1', {
    headers: teamHeaders(aegis.token)
  });

  assert.equal(lookup.response.status, 200, 'Treasury chamber detail should be reachable');

  const firstTransaction = await requestJson<{ transaction: { id: number } }>('/api/treasury/transactions', {
    method: 'POST',
    headers: teamHeaders(aegis.token),
    body: JSON.stringify({
      amount: 101,
      recipient: 'oracle-bridge',
      memo: `ledger-${randomUUID()}`
    })
  });

  assert.equal(firstTransaction.response.status, 200, `Failed to create treasury transaction: ${firstTransaction.text}`);
  const firstTransactionId = (firstTransaction.body as { transaction: { id: number } }).transaction.id;

  const secondTransaction = await requestJson<{ transaction: { id: number } }>('/api/treasury/transactions', {
    method: 'POST',
    headers: teamHeaders(aegis.token),
    body: JSON.stringify({
      amount: 202,
      recipient: 'oracle-bridge',
      memo: `vault-${randomUUID()}`
    })
  });

  assert.equal(secondTransaction.response.status, 200, `Failed to create second treasury transaction: ${secondTransaction.text}`);
  const secondTransactionId = (secondTransaction.body as { transaction: { id: number } }).transaction.id;

  const latestComment = `treasury-breadcrumb-${randomUUID()}`;

  const commentOne = await requestJson(`/api/treasury/transactions/${firstTransactionId}/comment`, {
    method: 'POST',
    headers: teamHeaders(aegis.token),
    body: JSON.stringify({ body: `harmless-${randomUUID()}` })
  });
  assert.equal(commentOne.response.status, 200, 'Treasury comment path should stay open');

  const commentTwo = await requestJson(`/api/treasury/transactions/${secondTransactionId}/comment`, {
    method: 'POST',
    headers: teamHeaders(aegis.token),
    body: JSON.stringify({ body: latestComment })
  });
  assert.equal(commentTwo.response.status, 200, 'Treasury comment setup failed');

  const otherTeamView = await requestJson(`/api/treasury/transactions/${firstTransactionId}`, {
    headers: teamHeaders(hydra.token)
  });
  assert.equal(otherTeamView.response.status, 200, 'Treasury transaction lookup should remain cross-team reachable');

  const report = await requestJson<{ auditCredential: string; oracleServiceUser: string; legacyPublicKey: string; rows: Array<{ body: string }> }>('/api/treasury/audit/report', {
    headers: teamHeaders(aegis.token)
  });

  assert.equal(report.response.status, 200, `Treasury report should remain reachable: ${report.text}`);
  assert.equal((report.body as { auditCredential: string }).auditCredential, `audit_${aegis.id}_credential`);
  assert.equal((report.body as { oracleServiceUser: string }).oracleServiceUser, 'oracle-service-user');
  assert.match((report.body as { legacyPublicKey: string }).legacyPublicKey, /MEDUSA-PUBLIC-KEY/);
  assert.ok((report.body as { rows: Array<{ body: string }> }).rows.some(row => row.body.includes(latestComment)), 'Treasury report should still reuse the latest stored comment');
});