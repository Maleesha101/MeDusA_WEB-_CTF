import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { assert, loginTeam, requestJson, teamHeaders } from './helpers.js';

test('whispers challenge keeps stored HTML and bot visits working', async () => {
  const team = await loginTeam('Orion', 'team-orion');
  const marker = randomUUID();
  const message = `<div onclick="window.__medusa = '${marker}'">hello</div>`;

  const post = await requestJson('/api/chat', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({ username: 'organizer', message })
  });

  assert.equal(post.response.status, 200, `Chat post should remain reachable: ${post.text}`);

  const messages = await requestJson<{ messages: Array<{ message: string }> }>('/api/chat', {
    headers: teamHeaders(team.token)
  });

  assert.equal(messages.response.status, 200, 'Chat timeline should remain reachable');
  assert.ok((messages.body as { messages: Array<{ message: string }> }).messages.some(entry => entry.message.includes(marker)), 'Stored chat HTML should remain readable from the timeline');

  const bot = await requestJson<{ token: string; flag: string }>('/api/chat/bot', {
    method: 'POST',
    headers: teamHeaders(team.token),
    body: JSON.stringify({})
  });

  assert.equal(bot.response.status, 200, `Whispers bot should remain reachable: ${bot.text}`);
  assert.match((bot.body as { token: string }).token, /^core-\d+-/);
  assert.equal((bot.body as { flag: string }).flag, 'flag{gorgon_whispers_static}');

  const chamber = await requestJson('/api/chamber/6', {
    headers: teamHeaders(team.token)
  });

  assert.equal(chamber.response.status, 200, 'Whispers chamber detail should be reachable');
});