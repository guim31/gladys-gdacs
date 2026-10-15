// -----------------------------------------------------------------------------
// GDACS client: the current events of the GDACS event API, as plain objects.
//
// `geteventlist/SEARCH` answers GeoJSON, 100 events a page, newest first, and
// HTTP 204 with an empty body once no event matches (a page past the last one
// included). Its date window keeps the events whose end date (`todate`) falls
// in it. An event stays current about 4 days after its last update (measured
// on 15/10/2026); droughts are updated every ten days: they are asked apart,
// over 14 days, the other hazards over 5. Events already over
// (`iscurrent: "false"`) are dropped.
// The service is public and keyless: no header carries a secret.
// -----------------------------------------------------------------------------

import { EVENT_TYPES, LEVELS } from './config.js';

export const API_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';
export const GDACS_SITE = 'https://www.gdacs.org';
export const USER_AGENT =
  'gladys-gdacs (Gladys Assistant integration; +https://github.com/guim31/gladys-gdacs)';

export const PAGE_SIZE = 100;
// At the green level, 270 current events on 15/10/2026 (forest fires mostly),
// 4 pages with the expired ones of the window: 10 pages leave room, and bound
// what one cycle can cost GDACS.
export const MAX_PAGES = 10;
export const WINDOW_DAYS = 5;
export const DROUGHT_WINDOW_DAYS = 14;

const DAY = 24 * 60 * 60 * 1000;

export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {number|null} status HTTP status, null for a network error or a bad body
   */
  constructor(message, status = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * GET `url` and parse its JSON body; null for a 204 (nothing matches).
 * @param {Function} fetchImpl fetch
 * @param {string} url
 */
export async function getJson(fetchImpl, url, { timeoutMs = 30000 } = {}) {
  const host = new URL(url).host;
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason =
      err?.name === 'TimeoutError' ? `no answer in ${timeoutMs / 1000} s` : err.message;
    throw new HttpError(`${host}: ${reason}`);
  }
  if (response.status === 204) {
    return null;
  }
  if (response.status !== 200) {
    throw new HttpError(`${host}: HTTP ${response.status}`, response.status);
  }
  const text = await response.text();
  if (text.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(`${host}: the answer is not JSON`, response.status);
  }
}

const day = (time) => new Date(time).toISOString().slice(0, 10);

/** The URL of one page of the search. */
export function searchUrl({ types, levels, now, page, windowDays = WINDOW_DAYS }) {
  const codes = EVENT_TYPES.filter((type) => types.includes(type.key)).map((type) => type.code);
  const gdacsLevels = LEVELS.filter((level) => levels.includes(level.key)).map(
    (level) => level.gdacs,
  );
  const params = new URLSearchParams({
    eventlist: codes.join(';'),
    alertlevel: gdacsLevels.join(';'),
    fromDate: day(now - windowDays * DAY),
    toDate: day(now + DAY),
    pagesize: String(PAGE_SIZE),
    pagenumber: String(page),
  });
  return `${API_URL}?${params}`;
}

const TYPE_BY_CODE = Object.fromEntries(EVENT_TYPES.map((type) => [type.code, type.key]));
const LEVEL_BY_GDACS = Object.fromEntries(LEVELS.map((level) => [level.gdacs, level.key]));

// GDACS dates are UTC without a zone designator.
function parseDate(text) {
  if (typeof text !== 'string' || text === '') {
    return null;
  }
  const time = Date.parse(/Z|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`);
  return Number.isFinite(time) ? time : null;
}

const clean = (text) =>
  String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,]+$/, '')
    .trim();

/**
 * One GeoJSON feature of the event list as a plain event, or null when it is
 * not usable (unknown type or level, no position).
 */
export function parseEvent(feature) {
  const p = feature?.properties ?? {};
  const type = TYPE_BY_CODE[p.eventtype];
  const level = LEVEL_BY_GDACS[p.alertlevel];
  const [longitude, latitude] = feature?.geometry?.coordinates ?? [];
  if (!type || !level || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (!Number.isInteger(p.eventid)) {
    return null;
  }
  const severity = p.severitydata ?? {};
  const countries = Array.isArray(p.affectedcountries) ? p.affectedcountries : [];
  return {
    key: `${p.eventtype}-${p.eventid}`,
    type,
    id: p.eventid,
    episode: Number.isInteger(p.episodeid) ? p.episodeid : null,
    level,
    current: p.iscurrent === true || p.iscurrent === 'true',
    // A cyclone has a name of its own ("SIMON-26"), a drought a region ("Europe-2026").
    name: clean(p.eventname) || null,
    title: clean(p.name),
    country: clean(p.country),
    countries: countries.flatMap((c) => [c.iso2, c.iso3]).filter((c) => typeof c === 'string'),
    latitude,
    longitude,
    severity: Number.isFinite(severity.severity) ? severity.severity : null,
    severityUnit: typeof severity.severityunit === 'string' ? severity.severityunit : '',
    severityText: clean(severity.severitytext),
    from: parseDate(p.fromdate),
    to: parseDate(p.todate),
    url:
      typeof p.url?.report === 'string' && p.url.report.startsWith('https://')
        ? p.url.report
        : GDACS_SITE,
  };
}

/** The current events of one search, page after page; `truncated` past the cap. */
async function search(fetchImpl, query, events) {
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const body = await getJson(fetchImpl, searchUrl({ ...query, page }));
    const features = Array.isArray(body?.features) ? body.features : [];
    for (const feature of features) {
      const event = parseEvent(feature);
      if (event?.current) {
        events.set(event.key, event);
      }
    }
    if (features.length < PAGE_SIZE) {
      return false;
    }
  }
  return true;
}

/**
 * The current events of the given types and levels (several pages if needed).
 * `truncated` says the page cap was reached: some events may be missing.
 */
export async function fetchCurrentEvents(fetchImpl, { types, levels, now }) {
  const events = new Map();
  let truncated = false;
  if (levels.length === 0) {
    return { events: [], truncated };
  }
  const others = types.filter((type) => type !== 'drought');
  if (others.length > 0) {
    truncated = await search(fetchImpl, { types: others, levels, now }, events);
  }
  if (types.includes('drought')) {
    const query = { types: ['drought'], levels, now, windowDays: DROUGHT_WINDOW_DAYS };
    truncated = (await search(fetchImpl, query, events)) || truncated;
  }
  return { events: [...events.values()], truncated };
}
