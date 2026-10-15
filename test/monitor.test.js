// -----------------------------------------------------------------------------
// The monitor on the recorded GDACS events: the followed area, the states of
// the device, the scene triggers (and when they must stay silent), the timer
// of the container, the centre and the persistence under /data.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_EVENT_KM } from '../src/device.js';
import { TRIGGERS } from '../src/monitor.js';
import {
  DR_EUROPE,
  EQ_COSTA_RICA,
  EQ_PANAMA,
  FL_USA,
  HOUSE,
  TC_SIMON,
  TC_TRUDY,
  WF_BRAZIL,
  create,
  createApi,
  createWorld,
  cycle,
  featureId,
  followedKeys,
} from './helpers/world.js';

async function world(t, config = {}, options = {}) {
  const w = await createWorld({ config, ...options });
  t.after(() => w.app.stop());
  return w;
}

test('the area: radius around the house, highest level first, then nearest', async (t) => {
  const w = await world(t);
  assert.deepEqual(followedKeys(w), [EQ_PANAMA, EQ_COSTA_RICA]);
  const wide = await world(t, { radius: '5000' });
  assert.deepEqual(followedKeys(wide), [
    TC_SIMON,
    EQ_PANAMA,
    EQ_COSTA_RICA,
    TC_TRUDY,
    FL_USA,
    WF_BRAZIL,
  ]);
});

test('the area: minimum level, event types, countries, worldwide red', async (t) => {
  const orange = await world(t, { radius: '5000', min_level: 'orange' });
  assert.deepEqual(followedKeys(orange), [TC_SIMON]);
  const quakes = await world(t, { radius: '5000', event_types: ['earthquake'] });
  assert.deepEqual(followedKeys(quakes), [EQ_PANAMA, EQ_COSTA_RICA]);
  // The European drought is 9,500 km away, but it touches France.
  const france = await world(t, { radius: '100', countries: 'fr' });
  assert.deepEqual(followedKeys(france), [DR_EUROPE]);
  const iso3 = await world(t, { radius: '100', countries: 'FRA' });
  assert.deepEqual(followedKeys(iso3), [DR_EUROPE]);
  // Worldwide red: none is current in the recording, then one appears in Guam.
  const api = createApi();
  const red = await world(t, { radius: '250', worldwide_red: true }, { api });
  assert.deepEqual(followedKeys(red), [EQ_PANAMA]);
  api.setLevel('TC-1001338', 'Red');
  await cycle(red);
  assert.deepEqual(followedKeys(red), ['TC-1001338', EQ_PANAMA]);
  // And only red: an orange event far away stays out.
  assert.ok(!followedKeys(red).includes(TC_SIMON));
});

test('coordinates of the configuration replace the house', async (t) => {
  // Mexico City: the cyclones are near, Panama is not.
  const w = await world(t, { latitude: '19,4326', longitude: '-99.1332', radius: '1000' });
  assert.deepEqual(followedKeys(w), [TC_SIMON, TC_TRUDY]);
});

test('the states of the device, once it is created', async (t) => {
  const w = await world(t, { radius: '5000', language: 'en' });
  assert.deepEqual(w.fake.states, [], 'nothing published before the device exists');
  const device = await create(w);
  assert.equal(w.fake.lastState(featureId(device, 'alert_count')), 6);
  assert.equal(w.fake.lastState(featureId(device, 'highest_level')), 2);
  assert.equal(w.fake.lastState(featureId(device, 'nearest_distance')), 182.1);
  const latest = w.fake.states.find(
    (s) => s.device_feature_external_id === featureId(device, 'latest_event'),
  );
  // The newest event: the earthquake of Costa Rica, 15/10 15:40 UTC.
  assert.equal(latest.text, 'Green · Earthquake M4.5 · Costa Rica · 731 km');
  assert.ok(w.fake.widgetRefreshes.length > 0);
});

test('no event in the area: count 0, level 0, a sentence, the farthest distance', async (t) => {
  const w = await world(t, { radius: '100', event_types: ['volcano'], language: 'fr' });
  const device = await create(w);
  assert.equal(w.fake.lastState(featureId(device, 'alert_count')), 0);
  assert.equal(w.fake.lastState(featureId(device, 'highest_level')), 0);
  assert.equal(w.fake.lastState(featureId(device, 'nearest_distance')), NO_EVENT_KM);
  const latest = w.fake.states.find(
    (s) => s.device_feature_external_id === featureId(device, 'latest_event'),
  );
  assert.equal(latest.text, 'Aucune alerte en cours');
});

test('only the changes are published again', async (t) => {
  const w = await world(t);
  await create(w);
  const before = w.fake.states.length;
  await cycle(w);
  await cycle(w);
  assert.equal(w.fake.states.length, before);
});

test('first start: the events already listed fire nothing; a new one does', async (t) => {
  const api = createApi();
  const w = await world(t, { language: 'en' }, { api });
  await create(w);
  assert.deepEqual(w.fake.sceneEvents, []);
  const key = api.addEvent(EQ_PANAMA, {
    id: 1600000,
    latitude: 9.1,
    longitude: -79.6,
    fromdate: '2026-10-15T18:50:00',
  });
  await cycle(w);
  assert.equal(w.fake.sceneEvents.length, 1);
  const [event] = w.fake.sceneEvents;
  assert.equal(event.key, TRIGGERS.NEW);
  assert.equal(event.data.event_type, 'earthquake');
  assert.equal(event.data.level, 'green');
  assert.equal(event.data.level_name, 'Green');
  assert.equal(event.data.event_type_name, 'Earthquake');
  assert.equal(event.data.name, 'Earthquake M4.5');
  assert.equal(event.data.country, 'Panama');
  assert.equal(event.data.distance_km, 16);
  assert.match(event.data.url, /^https:\/\/www\.gdacs\.org\/report\.aspx/);
  assert.equal(followedKeys(w)[0], key);
  // Seen once: the next cycles fire nothing.
  await cycle(w);
  assert.equal(w.fake.sceneEvents.length, 1);
});

test('an event entering the area (a cyclone moving) is new; leaving and coming back is not', async (t) => {
  const api = createApi();
  const w = await world(t, { radius: '1000' }, { api });
  const trudy = api.feature(TC_TRUDY);
  trudy.geometry.coordinates = [-82, 9]; // about 300 km from the house
  await cycle(w);
  assert.deepEqual(
    w.fake.sceneEvents.map((e) => [e.key, e.data.event_type]),
    [[TRIGGERS.NEW, 'tropical_cyclone']],
  );
  trudy.geometry.coordinates = [-101.6, 13.1];
  await cycle(w);
  trudy.geometry.coordinates = [-82, 9];
  await cycle(w);
  assert.equal(w.fake.sceneEvents.length, 1);
});

test('a raised level fires level_raised; a lowered one fires nothing', async (t) => {
  const api = createApi();
  const w = await world(t, { language: 'fr' }, { api });
  api.setLevel(EQ_PANAMA, 'Orange');
  await cycle(w);
  assert.equal(w.fake.sceneEvents.length, 1);
  const [raised] = w.fake.sceneEvents;
  assert.equal(raised.key, TRIGGERS.RAISED);
  assert.equal(raised.data.level, 'orange');
  assert.equal(raised.data.previous_level, 'green');
  assert.equal(raised.data.previous_level_name, 'Vert');
  assert.equal(raised.data.summary, 'Orange · Séisme M4,5 · Panama · 182 km');
  api.setLevel(EQ_PANAMA, 'Green');
  await cycle(w);
  assert.equal(w.fake.sceneEvents.length, 1);
  // Up again: it is a raise again.
  api.setLevel(EQ_PANAMA, 'Red');
  await cycle(w);
  assert.equal(w.fake.sceneEvents.at(-1).key, TRIGGERS.RAISED);
  assert.equal(w.fake.sceneEvents.at(-1).data.previous_level, 'green');
});

test('a restart fires nothing for what was already seen (/data)', async (t) => {
  const api = createApi();
  const first = await world(t, {}, { api });
  await first.app.stop();
  const key = api.addEvent(EQ_PANAMA, { id: 1600001 });
  const second = await world(t, {}, { api, dataDir: first.dataDir });
  // The new event appeared while the integration was stopped: it is news.
  assert.deepEqual(
    second.fake.sceneEvents.map((e) => e.key),
    [TRIGGERS.NEW],
  );
  await second.app.stop();
  const third = await world(t, {}, { api, dataDir: first.dataDir });
  assert.deepEqual(third.fake.sceneEvents, []);
  assert.ok(followedKeys(third).includes(key));
});

test('a wider area after a configuration change fires nothing', async (t) => {
  const w = await world(t);
  await w.fake.configUpdated({ radius: '5000' });
  assert.equal(followedKeys(w).length, 6);
  assert.deepEqual(w.fake.sceneEvents, []);
});

test('at most 20 scene events per cycle', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  for (let i = 0; i < 30; i += 1) {
    api.addEvent(EQ_PANAMA, { id: 1700000 + i });
  }
  await cycle(w);
  assert.equal(w.fake.sceneEvents.length, 20);
  assert.equal(followedKeys(w).length, 32);
});

test('without a located house nor coordinates: no distance, and the status says why', async (t) => {
  const w = await world(
    t,
    { countries: 'FR' },
    { houses: [{ ...HOUSE, latitude: null, longitude: null }] },
  );
  const device = await create(w);
  assert.deepEqual(followedKeys(w), [DR_EUROPE]);
  assert.equal(w.fake.lastState(featureId(device, 'alert_count')), 1);
  assert.equal(w.fake.lastState(featureId(device, 'nearest_distance')), undefined);
  assert.match(w.fake.connectionStatus.message.en, /No centre/);
  // No invented "0 km" in the texts.
  const latest = w.fake.states.find(
    (s) => s.device_feature_external_id === featureId(device, 'latest_event'),
  );
  assert.doesNotMatch(latest.text, /km/);
  const { data } = await w.fake.sceneAction('read_alerts', {});
  assert.doesNotMatch(data.outputs.text, /km/);
});

test('a configuration change during a cycle still fires nothing for the wider area', async (t) => {
  const w = await world(t);
  // A cycle in flight with the old configuration, then the change.
  const running = w.monitor.runCycle();
  const saved = w.fake.configUpdated({ radius: '5000' });
  await running;
  await saved;
  assert.equal(followedKeys(w).length, 6);
  assert.deepEqual(w.fake.sceneEvents, []);
});

test('a first cycle without any event still refreshes the widget', async (t) => {
  const w = await world(t, { event_types: ['volcano'] });
  assert.ok(w.fake.widgetRefreshes.length > 0);
});

test('GDACS down: the status says it, the last values stay, and they come back', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  api.down = 503;
  await cycle(w);
  assert.equal(w.fake.connectionStatus.connected, false);
  assert.match(w.fake.connectionStatus.message.fr, /GDACS ne répond pas/);
  assert.deepEqual(followedKeys(w), [EQ_PANAMA, EQ_COSTA_RICA]);
  api.down = false;
  await cycle(w);
  assert.equal(w.fake.connectionStatus.connected, true);
});

test('the container reads GDACS on its own timer, without any onPoll', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const api = createApi();
  const w = await world(t, { refresh_interval: '10' }, { api, timers: true });
  await create(w);
  const before = api.requests.length;
  api.setLevel(EQ_PANAMA, 'Orange');
  t.mock.timers.tick(10 * 60 * 1000);
  await w.monitor.running;
  assert.equal(api.requests.length, before + 2);
  assert.equal(w.fake.lastState(featureId(w.fake.discoveredDevices[0], 'highest_level')), 2);
});

test('onPoll, the fallback: reads again only after half an interval', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  const device = await create(w);
  const before = api.requests.length;
  assert.deepEqual(await w.fake.poll(device), { success: true });
  assert.equal(api.requests.length, before);
  w.clock.advance(8 * 60 * 1000);
  await w.fake.poll(device);
  assert.equal(api.requests.length, before + 2);
});
