// -----------------------------------------------------------------------------
// The GDACS client on the recorded events: parsing of every event type, the
// search URL, the paging and the answers of a service in trouble.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HttpError,
  MAX_PAGES,
  PAGE_SIZE,
  fetchCurrentEvents,
  getJson,
  parseEvent,
  searchUrl,
} from '../src/gdacs.js';
import { EVENT_TYPE_KEYS, LEVEL_KEYS } from '../src/config.js';
import { DR_EUROPE, START, TC_SIMON, createApi, fixture } from './helpers/world.js';

const recorded = fixture('gdacs/events-2026-10-15.json').features;
const ALL = { types: EVENT_TYPE_KEYS, levels: LEVEL_KEYS, now: START };

test('every recorded event parses, the six hazards and three levels among them', () => {
  const events = recorded.map(parseEvent);
  assert.ok(events.every(Boolean));
  assert.deepEqual(new Set(events.map((e) => e.type)), new Set(EVENT_TYPE_KEYS));
  assert.deepEqual(new Set(events.map((e) => e.level)), new Set(LEVEL_KEYS));
  assert.equal(events.filter((e) => !e.current).length, 3);
});

test('a cyclone: name, wind speed, position, report, UTC dates', () => {
  const simon = parseEvent(recorded.find((f) => f.properties.eventid === 1001335));
  assert.equal(simon.key, TC_SIMON);
  assert.equal(simon.type, 'tropical_cyclone');
  assert.equal(simon.level, 'orange');
  assert.equal(simon.name, 'SIMON-26');
  assert.equal(simon.country, 'México');
  assert.equal(simon.severityUnit, 'km/h');
  assert.equal(Math.round(simon.severity), 250);
  assert.deepEqual([simon.latitude, simon.longitude], [19.2, -108.1]);
  assert.equal(simon.from, Date.parse('2026-10-07T15:00:00Z'));
  assert.match(simon.url, /^https:\/\/www\.gdacs\.org\/report\.aspx\?eventid=1001335/);
});

test('a drought over 29 countries: trailing commas cleaned, ISO codes kept', () => {
  const drought = parseEvent(recorded.find((f) => f.properties.eventid === 1018332));
  assert.equal(drought.key, DR_EUROPE);
  assert.equal(drought.name, 'Europe-2026');
  assert.ok(!drought.country.endsWith(','));
  assert.ok(drought.countries.includes('FR') && drought.countries.includes('FRA'));
});

test('unusable features are dropped', () => {
  const base = structuredClone(recorded[0]);
  assert.equal(parseEvent({ ...base, properties: { ...base.properties, eventtype: 'XX' } }), null);
  assert.equal(parseEvent({ ...base, properties: { ...base.properties, alertlevel: '' } }), null);
  assert.equal(parseEvent({ ...base, geometry: { type: 'Point', coordinates: [] } }), null);
  assert.equal(parseEvent(null), null);
});

test('the search asks for the chosen types and levels, over the last 5 days', () => {
  const url = new URL(
    searchUrl({ types: ['earthquake', 'flood'], levels: ['orange', 'red'], now: START, page: 2 }),
  );
  assert.equal(url.host, 'www.gdacs.org');
  assert.equal(url.searchParams.get('eventlist'), 'EQ;FL');
  assert.equal(url.searchParams.get('alertlevel'), 'Orange;Red');
  assert.equal(url.searchParams.get('fromDate'), '2026-10-10');
  assert.equal(url.searchParams.get('toDate'), '2026-10-16');
  assert.equal(url.searchParams.get('pagesize'), String(PAGE_SIZE));
  assert.equal(url.searchParams.get('pagenumber'), '2');
});

test('droughts are asked apart, over 14 days (updated every ten days)', async () => {
  const api = createApi();
  await fetchCurrentEvents(api.fetch, ALL);
  assert.deepEqual(
    api.requests.map((url) => [
      url.searchParams.get('eventlist'),
      url.searchParams.get('fromDate'),
    ]),
    [
      ['EQ;TC;FL;VO;WF', '2026-10-10'],
      ['DR', '2026-10-01'],
    ],
  );
});

test('only the current events are kept; a 204 is an empty answer', async () => {
  const api = createApi();
  const { events, truncated } = await fetchCurrentEvents(api.fetch, ALL);
  assert.equal(events.length, 9);
  assert.equal(truncated, false);
  assert.equal(api.requests.length, 2);
  const none = await fetchCurrentEvents(api.fetch, { ...ALL, types: ['volcano'] });
  assert.deepEqual(none.events, []);
  assert.deepEqual((await fetchCurrentEvents(api.fetch, { ...ALL, types: [] })).events, []);
});

test('pages are read until a short one, and capped', async () => {
  const api = createApi();
  for (let i = 0; i < 250; i += 1) {
    api.addEvent('WF-1032713', { id: 2000000 + i });
  }
  const { events, truncated } = await fetchCurrentEvents(api.fetch, ALL);
  assert.equal(api.requests.length, 4);
  assert.equal(events.length, 259);
  assert.equal(truncated, false);

  const flooded = createApi();
  for (let i = 0; i < PAGE_SIZE * MAX_PAGES + 5; i += 1) {
    flooded.addEvent('WF-1032713', { id: 3000000 + i });
  }
  const capped = await fetchCurrentEvents(flooded.fetch, ALL);
  assert.equal(flooded.requests.length, MAX_PAGES + 1);
  assert.equal(capped.truncated, true);
});

test('HTTP errors, network errors and bad bodies are HttpErrors', async () => {
  const api = createApi();
  api.down = 503;
  await assert.rejects(fetchCurrentEvents(api.fetch, ALL), (err) => {
    assert.ok(err instanceof HttpError);
    assert.equal(err.status, 503);
    assert.equal(err.message, 'www.gdacs.org: HTTP 503');
    return true;
  });
  api.down = 'network';
  await assert.rejects(fetchCurrentEvents(api.fetch, ALL), /www\.gdacs\.org: fetch failed/);
  const html = async () => ({ status: 200, text: async () => '<html>' });
  await assert.rejects(getJson(html, 'https://www.gdacs.org/x'), /not JSON/);
  const timeout = async () => {
    throw Object.assign(new Error('aborted'), { name: 'TimeoutError' });
  };
  await assert.rejects(getJson(timeout, 'https://www.gdacs.org/x'), /no answer in 30 s/);
});
