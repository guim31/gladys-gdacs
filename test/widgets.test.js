// -----------------------------------------------------------------------------
// The `alerts` widget and the two actions: contents within the core budget
// (validateWidgetContent: an empty array means rendered as sent), the order of
// the alerts, the texts of every language, and the sentence of the scene
// action and of the configuration action.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { LANGUAGES } from '../src/config.js';
import { MAX_ITEMS } from '../src/widgets.js';
import { EQ_PANAMA, createApi, createWorld } from './helpers/world.js';

async function world(t, config = {}, options = {}) {
  const w = await createWorld({ config, ...options });
  t.after(() => w.app.stop());
  return w;
}

const content = async (w, language) =>
  (await w.fake.widgetGet('alerts', { settings: {}, language })).data.content;

test('the widget lists the alerts, highest level first, within the budget', async (t) => {
  const w = await world(t, { radius: '5000' });
  for (const language of LANGUAGES) {
    const widget = await content(w, language);
    assert.deepEqual(validateWidgetContent(widget), [], language);
    const list = widget.components.find((c) => c.type === 'card-list');
    assert.equal(list.items.length, 6);
    assert.match(list.items[0].title, /SIMON-26/);
    assert.equal(list.items[0].badge.color, 'warning');
    assert.equal(list.items[1].badge.color, 'info');
    assert.match(list.items[0].links[0].url, /^https:\/\/www\.gdacs\.org\/report\.aspx/);
  }
  const fr = await content(w, 'fr');
  assert.equal(fr.components[0].text, '6 alertes GDACS');
  assert.equal(
    fr.components.find((c) => c.type === 'card-list').items[1].subtitle,
    'Panama · 182 km',
  );
  assert.match(fr.components.find((c) => c.variant === 'caption').text, /^Source : GDACS · 15\/10/);
});

test('more alerts than rows: the heading says how many are shown', async (t) => {
  const api = createApi();
  for (let i = 0; i < 10; i += 1) {
    api.addEvent(EQ_PANAMA, { id: 1800000 + i });
  }
  const w = await world(t, {}, { api });
  const widget = await content(w, 'en');
  assert.deepEqual(validateWidgetContent(widget), []);
  assert.equal(widget.components[0].text, `12 GDACS alerts (${MAX_ITEMS} shown)`);
  assert.equal(widget.components.find((c) => c.type === 'card-list').items.length, MAX_ITEMS);
});

test('no alert, and GDACS never reached: a heading, no empty list', async (t) => {
  const quiet = await world(t, { event_types: ['volcano'] });
  const none = await content(quiet, 'de');
  assert.deepEqual(validateWidgetContent(none), []);
  assert.equal(none.components[0].text, 'Keine GDACS-Warnung');
  assert.ok(!none.components.some((c) => c.type === 'card-list'));

  const api = createApi();
  api.down = 'network';
  const down = await world(t, {}, { api });
  const waiting = await content(down, 'es');
  assert.deepEqual(validateWidgetContent(waiting), []);
  assert.equal(waiting.components[0].text, 'Esperando a GDACS…');
});

test('read_alerts: one sentence, the count and the highest level', async (t) => {
  const w = await world(t, { radius: '5000', language: 'en' });
  const { success, data } = await w.fake.sceneAction('read_alerts', {});
  assert.equal(success, true);
  assert.equal(data.outputs.count, 6);
  assert.equal(data.outputs.max_level, 'orange');
  assert.match(
    data.outputs.text,
    /^6 GDACS alerts: Orange · Tropical cyclone SIMON-26 250 km\/h in México, 3,279 km away; Green · Earthquake M4\.5 in Panama, 182 km away; .*; and 1 more\.$/,
  );
  const quiet = await world(t, { event_types: ['volcano'], language: 'fr' });
  const none = await quiet.fake.sceneAction('read_alerts', {});
  assert.deepEqual(none.data.outputs, {
    text: 'Aucune alerte GDACS dans votre zone.',
    count: 0,
    max_level: 'none',
  });
});

test('read_alerts reads GDACS again when the last cycle is old, and fails if it never answered', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  const before = api.requests.length;
  await w.fake.sceneAction('read_alerts', {});
  assert.equal(api.requests.length, before);
  w.clock.advance(16 * 60 * 1000);
  api.setLevel(EQ_PANAMA, 'Red');
  const { data } = await w.fake.sceneAction('read_alerts', {});
  assert.equal(api.requests.length, before + 2);
  assert.equal(data.outputs.max_level, 'red');

  const downApi = createApi();
  downApi.down = 503;
  const down = await world(t, {}, { api: downApi });
  const failed = await down.fake.sceneAction('read_alerts', {});
  assert.equal(failed.success, false);
  assert.match(failed.error, /GDACS ne répond pas/);
});

test('check_now answers in the four languages', async (t) => {
  const w = await world(t, { radius: '5000', min_level: 'orange' });
  const { data } = await w.fake.action('check_now', {});
  assert.deepEqual(Object.keys(data.message), LANGUAGES);
  assert.match(data.message.fr, /^1 alerte GDACS : Orange · Cyclone tropical SIMON-26/);
  assert.match(data.message.de, /Geprüft um 20:40\.$/);
});
