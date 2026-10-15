// -----------------------------------------------------------------------------
// A complete test world: the SDK's fake Gladys, a fake GDACS serving the
// recorded events of test/fixtures (filtered and paged the way the real API
// does), a manual clock, a temporary /data, and the integration wired on top
// through registerHandlers. Nothing touches the network.
// -----------------------------------------------------------------------------

import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';
import { Store } from '../../src/store.js';

process.env.LOG_LEVEL ??= 'silent';
process.env.TZ = 'Europe/Paris';

export const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));

// The events were recorded on 15/10/2026 around 18:35 UTC.
export const START = Date.parse('2026-10-15T18:40:00Z');

// A house in Panama City (public coordinates of the city centre).
export const HOUSE = {
  id: 'house-1',
  name: 'Casa',
  selector: 'casa',
  latitude: 8.9824,
  longitude: -79.5199,
};

// Keys of the recorded events (type code and GDACS event id).
export const EQ_PANAMA = 'EQ-1571772'; // green, 172 km from the house
export const EQ_COSTA_RICA = 'EQ-1571782'; // green, about 720 km
export const EQ_ALASKA = 'EQ-1571732'; // green, far away
export const TC_SIMON = 'TC-1001335'; // orange, Mexico, about 3,300 km
export const TC_TRUDY = 'TC-1001337'; // green, Mexico, about 2,400 km
export const TC_CHAMPI = 'TC-1001338'; // orange, Guam
export const DR_EUROPE = 'DR-1018332'; // orange, centroid in Germany, touches France
export const FL_USA = 'FL-1103888';
export const WF_BRAZIL = 'WF-1032713';

const keyOf = (feature) => `${feature.properties.eventtype}-${feature.properties.eventid}`;

/**
 * Fake GDACS. `api.down`: 'network' (connection refused), a status (503) or false.
 */
export function createApi() {
  const recorded = fixture('gdacs/events-2026-10-15.json');
  const api = {
    features: structuredClone(recorded.features),
    down: false,
    requests: [],

    feature(key) {
      return api.features.find((feature) => keyOf(feature) === key);
    },

    /** Change the alert level of an event ('Green', 'Orange', 'Red'). */
    setLevel(key, level) {
      api.feature(key).properties.alertlevel = level;
    },

    /** A new current event, copied from a recorded one, with a new id. */
    addEvent(fromKey, { id, level, latitude, longitude, fromdate } = {}) {
      const feature = structuredClone(api.feature(fromKey));
      const p = feature.properties;
      p.eventid = id;
      if (level) {
        p.alertlevel = level;
      }
      if (latitude !== undefined) {
        feature.geometry.coordinates = [longitude, latitude];
      }
      if (fromdate) {
        p.fromdate = fromdate;
      }
      p.iscurrent = 'true';
      api.features.unshift(feature);
      return `${p.eventtype}-${id}`;
    },

    /** The event is over. */
    end(key) {
      api.feature(key).properties.iscurrent = 'false';
    },

    search(url) {
      const params = url.searchParams;
      const types = params.get('eventlist').split(';');
      const levels = params.get('alertlevel').split(';');
      const from = params.get('fromDate');
      const to = params.get('toDate');
      const size = Number(params.get('pagesize'));
      const page = Number(params.get('pagenumber'));
      const matching = api.features.filter((feature) => {
        const p = feature.properties;
        return (
          types.includes(p.eventtype) &&
          levels.includes(p.alertlevel) &&
          p.todate.slice(0, 10) >= from &&
          p.fromdate.slice(0, 10) <= to
        );
      });
      return matching.slice((page - 1) * size, page * size);
    },

    async fetch(input) {
      const url = new URL(input);
      api.requests.push(url);
      if (api.down === 'network') {
        throw new TypeError('fetch failed');
      }
      if (api.down) {
        return { status: api.down, text: async () => 'Service Unavailable' };
      }
      if (!url.pathname.endsWith('/geteventlist/SEARCH')) {
        return { status: 404, text: async () => 'Not Found' };
      }
      const features = api.search(url);
      if (features.length === 0) {
        // The real API answers 204 with an empty body.
        return { status: 204, text: async () => '' };
      }
      const body = { type: 'FeatureCollection', features };
      return { status: 200, text: async () => JSON.stringify(body) };
    },
  };
  return api;
}

/** A manual clock. */
export function createClock(start = START) {
  const clock = {
    time: start,
    now: () => clock.time,
    advance(ms) {
      clock.time += ms;
    },
  };
  return clock;
}

/**
 * @param {object} [options]
 * @param {object} [options.config] raw integration config
 * @param {Array} [options.devices] devices already created in Gladys
 * @param {Array} [options.houses] houses of Gladys
 * @param {object} [options.api] from createApi
 * @param {boolean} [options.connect]
 * @param {boolean} [options.timers] true: the monitor's own timer runs (mock it)
 */
export async function createWorld({
  config = {},
  devices = [],
  houses = [HOUSE],
  api = createApi(),
  connect = true,
  timers = false,
  clock = createClock(),
  dataDir = mkdtempSync(join(tmpdir(), 'gladys-gdacs-')),
} = {}) {
  const gladys = createFakeGladys({ config, devices, houses });
  const store = new Store(dataDir);
  const app = registerHandlers(gladys, { store, fetch: api.fetch, timers, now: clock.now });
  if (connect) {
    await gladys.connect();
    await app.ready;
    await app.monitor.running;
  }
  return { gladys, fake: gladys.fake, app, monitor: app.monitor, api, clock, store, dataDir };
}

/** Create the device in Gladys, as the user would. */
export async function create(world) {
  const [device] = world.fake.discoveredDevices;
  await world.fake.deviceCreated(device);
  return device;
}

/** External id of one feature of a device. */
export const featureId = (device, key) =>
  device.features.find((feature) => feature.external_id.endsWith(`:${key}`))?.external_id;

/** Run one refresh cycle, `minutes` later. */
export async function cycle(world, minutes = 15) {
  world.clock.advance(minutes * 60 * 1000);
  await world.monitor.runCycle();
}

/** Keys of the followed events, in display order. */
export const followedKeys = (world) => world.monitor.events.map((event) => event.key);

/**
 * Capture the integration's log lines at `level` and above (LOG_LEVEL is read
 * at every call). Returns the lines as `{ level, text }`.
 */
export function captureLogs(t, level = 'info') {
  const previous = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = level;
  const lines = [];
  const record = (...args) => {
    const text = args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' ');
    const match = /^\[[^\]]+\] \[(\w+)\]/.exec(text);
    lines.push({ level: match ? match[1].toLowerCase() : 'raw', text });
  };
  t.mock.method(console, 'log', record);
  t.mock.method(console, 'error', record);
  t.after(() => {
    process.env.LOG_LEVEL = previous;
  });
  return lines;
}
