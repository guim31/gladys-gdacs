// -----------------------------------------------------------------------------
// Normalization of the configuration: what a user can type or leave empty.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_TYPE_KEYS,
  normalizeConfig,
  parseCoordinate,
  parseCountries,
} from '../src/config.js';

test('the defaults: house, 1000 km, every type, green and above, 15 min, French', () => {
  assert.deepEqual(normalizeConfig(), {
    center: null,
    invalidCenter: false,
    radiusKm: 1000,
    countries: [],
    invalidCountries: [],
    eventTypes: EVENT_TYPE_KEYS,
    minLevel: 'green',
    worldwideRed: false,
    refreshMinutes: 15,
    language: 'fr',
  });
});

test('coordinates: decimal point or comma, bounded; both or none', () => {
  assert.equal(parseCoordinate('43,6045', 90), 43.6045);
  assert.equal(parseCoordinate(' -1.5 ', 180), -1.5);
  assert.equal(parseCoordinate('91', 90), null);
  assert.equal(parseCoordinate('N43', 90), null);
  assert.equal(parseCoordinate('', 90), null);
  assert.deepEqual(normalizeConfig({ latitude: '43,6', longitude: '1,44' }).center, {
    latitude: 43.6,
    longitude: 1.44,
  });
  const half = normalizeConfig({ latitude: '43.6', longitude: '' });
  assert.equal(half.center, null);
  assert.equal(half.invalidCenter, true);
});

test('countries: ISO 2 or 3 letters, any separator, upper-cased, deduplicated', () => {
  assert.deepEqual(parseCountries('fr; ESP, fr  pt, 12, France'), {
    codes: ['FR', 'ESP', 'PT'],
    invalid: ['12', 'France'],
  });
});

test('unknown select values fall back on the defaults; types keep the manifest order', () => {
  const config = normalizeConfig({
    radius: '42',
    refresh_interval: '1',
    min_level: 'purple',
    language: 'it',
    event_types: ['wildfire', 'earthquake', 'meteor'],
    worldwide_red: 'true',
  });
  assert.equal(config.radiusKm, 1000);
  assert.equal(config.refreshMinutes, 15);
  assert.equal(config.minLevel, 'green');
  assert.equal(config.language, 'fr');
  assert.deepEqual(config.eventTypes, ['earthquake', 'wildfire']);
  assert.equal(config.worldwideRed, true);
  assert.deepEqual(normalizeConfig({ event_types: [] }).eventTypes, []);
});
