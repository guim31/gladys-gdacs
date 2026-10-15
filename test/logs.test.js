// -----------------------------------------------------------------------------
// What the integration writes to `docker logs`: at info, only the lifecycle
// (the start, an orange or red alert, GDACS lost and back, a user action),
// never one line per refresh cycle; a failure that repeats at every cycle is
// logged once, plus one line when it is over. Never the coordinates of the
// centre: the location of the home is the sensitive data here.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EQ_PANAMA,
  HOUSE,
  captureLogs,
  create,
  createApi,
  createWorld,
  cycle,
} from './helpers/world.js';

const strip = (line) => line.text.replace(/^\[[^\]]+\] /, '');

async function world(t, config = {}, options = {}) {
  const w = await createWorld({ config, ...options });
  t.after(() => w.app.stop());
  return w;
}

test('the start is one info line', async (t) => {
  const lines = captureLogs(t, 'info');
  await world(t);
  assert.deepEqual(lines.map(strip), ['[INFO] [gdacs] Started: GDACS alerts read every 15 min']);
});

test('normal refresh cycles write nothing at info, green news included', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  await create(w);
  const lines = captureLogs(t, 'info');
  api.addEvent(EQ_PANAMA, { id: 1900000 });
  for (let i = 0; i < 4; i += 1) {
    await cycle(w);
  }
  assert.equal(w.fake.sceneEvents.length, 1);
  assert.deepEqual(lines, []);
});

test('an orange or red alert is one info line, without the distance', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  const lines = captureLogs(t, 'info');
  api.setLevel(EQ_PANAMA, 'Orange');
  await cycle(w);
  await cycle(w);
  assert.deepEqual(lines.map(strip), [
    '[INFO] [gdacs] Alert raised from green to orange: Earthquake M4.5 · Panama',
  ]);
});

test('LOG_LEVEL=debug shows the cycles, never the coordinates of the centre', async (t) => {
  const lines = captureLogs(t, 'debug');
  const w = await world(t);
  await cycle(w);
  const configured = await world(t, { latitude: '43.6045', longitude: '1.444' });
  await cycle(configured);
  assert.ok(
    lines.some((line) => /Refresh cycle: 9 current event\(s\), 2 followed/.test(line.text)),
  );
  const all = lines.map((line) => line.text).join('\n');
  for (const value of [HOUSE.latitude, HOUSE.longitude, 43.6045, 1.444]) {
    assert.doesNotMatch(all, new RegExp(String(value).replace('.', '\\.')));
  }
});

test('GDACS down at every cycle: one warning, then one line at recovery', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  const lines = captureLogs(t, 'info');
  api.down = 503;
  for (let i = 0; i < 4; i += 1) {
    await cycle(w);
  }
  assert.deepEqual(
    lines.map((line) => [line.level, strip(line).replace(/^\[\w+\] /, '')]),
    [['warn', '[gdacs] GDACS unreachable: www.gdacs.org: HTTP 503']],
  );
  api.down = false;
  await cycle(w);
  assert.deepEqual(lines.slice(1).map(strip), ['[INFO] [gdacs] GDACS answers again']);
});

test('states refused at every cycle: one warning, then one line at recovery', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  await create(w);
  const lines = captureLogs(t, 'info');
  const publish = t.mock.method(w.gladys, 'publishChangedStates', async () => {
    throw new Error('Gladys unreachable');
  });
  for (let i = 0; i < 3; i += 1) {
    await cycle(w);
  }
  assert.ok(publish.mock.callCount() >= 3);
  assert.deepEqual(
    lines.map((line) => [line.level, strip(line).replace(/^\[\w+\] /, '')]),
    [['warn', '[gdacs] Publishing the states failed: Gladys unreachable']],
  );
  publish.mock.restore();
  await cycle(w);
  assert.match(lines.at(-1).text, /\[INFO\].*Publishing the states works again/);
});

test('a configuration problem is said once, at the start or the save', async (t) => {
  const lines = captureLogs(t, 'info');
  const w = await world(t, { latitude: 'abc', longitude: '2', countries: 'FR, 123' });
  for (let i = 0; i < 3; i += 1) {
    await cycle(w);
  }
  assert.deepEqual(lines.map(strip), [
    '[WARN] [gdacs] The coordinates of the configuration are not valid: the house is used',
    '[WARN] [gdacs] Not a country code, ignored: 123',
    '[INFO] [gdacs] Started: GDACS alerts read every 15 min',
  ]);
});
