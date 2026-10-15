// -----------------------------------------------------------------------------
// Integration configuration: defaults (they mirror the `default` values of the
// manifest `config_schema`, see test/manifest.test.js) and normalization, so
// the rest of the code never deals with strings, blanks or `undefined`.
//
// Select values are strings in the manifest (stored by Gladys as typed); the
// normalized config holds numbers.
// -----------------------------------------------------------------------------

export const LANGUAGES = ['en', 'fr', 'de', 'es'];

// The six GDACS hazards, in the order of the GDACS map. The key is the stable
// English word the manifest, the scene triggers and the docs use; `code` is
// the GDACS event type.
export const EVENT_TYPES = [
  { key: 'earthquake', code: 'EQ' },
  { key: 'tropical_cyclone', code: 'TC' },
  { key: 'flood', code: 'FL' },
  { key: 'volcano', code: 'VO' },
  { key: 'drought', code: 'DR' },
  { key: 'wildfire', code: 'WF' },
];
export const EVENT_TYPE_KEYS = EVENT_TYPES.map((type) => type.key);

// GDACS alert levels, lowest first. `rank` is also the value of the "highest
// level" feature (0 = no alert).
export const LEVELS = [
  { key: 'green', gdacs: 'Green', rank: 1 },
  { key: 'orange', gdacs: 'Orange', rank: 2 },
  { key: 'red', gdacs: 'Red', rank: 3 },
];
export const LEVEL_KEYS = LEVELS.map((level) => level.key);

// Kilometres around the centre. GDACS events are large (a cyclone track, a
// magnitude 6 earthquake felt hundreds of kilometres away): no small radius.
export const RADII = ['100', '250', '500', '1000', '2000', '5000'];

// Minutes between two readings. GDACS publishes an earthquake within about
// 20 minutes and updates cyclones every 6 hours: faster would only ask the
// same thing again.
export const REFRESH_INTERVALS = ['10', '15', '30', '60'];

export const DEFAULT_CONFIG = {
  latitude: '',
  longitude: '',
  radius: '1000',
  countries: '',
  event_types: EVENT_TYPE_KEYS,
  min_level: 'green',
  worldwide_red: false,
  refresh_interval: '15',
  language: 'fr',
};

const tokens = (text) =>
  String(text ?? '')
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);

/** A coordinate typed by the user (decimal comma accepted), null if blank or invalid. */
export function parseCoordinate(value, limit) {
  const text = String(value ?? '')
    .trim()
    .replace(',', '.');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    return null;
  }
  const number = Number(text);
  return Math.abs(number) <= limit ? number : null;
}

/** ISO 3166 country codes (2 or 3 letters) of a free text; `invalid` lists the rest. */
export function parseCountries(text) {
  const codes = [];
  const invalid = [];
  for (const token of tokens(text)) {
    const code = token.toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(code)) {
      invalid.push(token);
    } else if (!codes.includes(code)) {
      codes.push(code);
    }
  }
  return { codes, invalid };
}

const pick = (value, allowed, fallback) =>
  allowed.includes(String(value)) ? Number(value) : Number(fallback);

function eventTypes(value) {
  // A multi_select is stored as an array; an unset field keeps the default.
  if (!Array.isArray(value)) {
    return [...EVENT_TYPE_KEYS];
  }
  return EVENT_TYPE_KEYS.filter((key) => value.includes(key));
}

/**
 * @param {Record<string, unknown>} raw the configuration returned by the SDK
 */
export function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const latitude = parseCoordinate(source.latitude, 90);
  const longitude = parseCoordinate(source.longitude, 180);
  // Both or none: half a centre falls back on the house.
  const center = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const typed = String(source.latitude ?? '').trim() + String(source.longitude ?? '').trim();
  const countries = parseCountries(source.countries);
  return {
    center,
    // Something was typed but is not a pair of coordinates: said once in the logs.
    invalidCenter: center === null && typed !== '',
    radiusKm: pick(source.radius, RADII, DEFAULT_CONFIG.radius),
    countries: countries.codes,
    invalidCountries: countries.invalid,
    eventTypes: eventTypes(source.event_types),
    minLevel: LEVEL_KEYS.includes(source.min_level) ? source.min_level : DEFAULT_CONFIG.min_level,
    worldwideRed: source.worldwide_red === true || source.worldwide_red === 'true',
    refreshMinutes: pick(
      source.refresh_interval,
      REFRESH_INTERVALS,
      DEFAULT_CONFIG.refresh_interval,
    ),
    language: LANGUAGES.includes(source.language) ? source.language : DEFAULT_CONFIG.language,
  };
}

export const levelRank = (key) => LEVELS.find((level) => level.key === key)?.rank ?? 0;
