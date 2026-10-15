// -----------------------------------------------------------------------------
// The monitor: reads the current GDACS events every `refresh_interval`
// minutes, keeps those of the followed area, publishes the states of the
// device, fires the scene triggers and serves the widget and the actions.
//
// Followed area: the events within the radius of the centre (the coordinates
// of the configuration, or the first located house of Gladys), the events
// touching one of the chosen countries, and, when asked, every red alert of
// the world. The distance is measured to the point GDACS gives: the epicentre,
// the current position of a cyclone, the centre of a flood, a drought or a fire.
//
// Triggers: "new event" when an event enters the followed area for the first
// time, "level raised" when the alert level of a followed event goes up. The
// events already there at the first start, or when the configuration changes,
// fire nothing: they are not news. What was seen is kept under /data, so a
// restart fires nothing either.
//
// States: `publishChangedStates` sends only what changed, plus a heartbeat every
// 12 hours. The coordinates of the centre are never logged.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { LEVELS, levelRank } from './config.js';
import { NO_EVENT_KM, buildDevice, deviceIds } from './device.js';
import { fetchCurrentEvents } from './gdacs.js';
import { distanceKm } from './geo.js';
import {
  LEVEL_NAMES,
  PHRASES,
  STATUS,
  TYPE_NAMES,
  describe,
  headlineOf,
  join,
  placeOf,
  render,
} from './messages.js';

const logger = createLogger({ name: 'gdacs' });

export const WIDGET_KEY = 'alerts';
export const TRIGGERS = { NEW: 'new_event', RAISED: 'level_raised' };

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const DEFAULT_TIMINGS = {
  heartbeatMs: 12 * HOUR,
  // An event no longer listed for this long is forgotten: back, it is new again.
  forgetAfterMs: 3 * DAY,
  // requestWidgetRefresh is rate-limited to one call every 10 s by the core.
  widgetRefreshMs: 10000,
  // The houses of Gladys are read again this often (no update event).
  housesMaxAgeMs: HOUR,
};

// Scene events fired by one cycle at most: the core takes 300 a minute, and a
// burst of news is better summed up by the device than by 50 scenes.
export const MAX_EVENTS_PER_CYCLE = 20;

const byLevelThenDistance = (a, b) =>
  levelRank(b.level) - levelRank(a.level) ||
  (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
  (b.from ?? 0) - (a.from ?? 0);

export class Monitor {
  /**
   * @param {object} options
   * @param {object} options.gladys GladysIntegration (or the SDK fake)
   * @param {object} options.store see src/store.js
   * @param {Function} [options.fetch] fetch
   * @param {boolean} [options.timers] false: no background timer (tests drive the cycles)
   * @param {Function} [options.now] clock in ms
   * @param {object} [options.timings] overrides of DEFAULT_TIMINGS
   */
  constructor({ gladys, store, fetch: fetchImpl, timers = true, now, timings }) {
    this.gladys = gladys;
    this.store = store;
    this.fetch = fetchImpl ?? ((...args) => fetch(...args));
    this.timers = timers;
    this.now = now ?? (() => Date.now());
    this.timings = { ...DEFAULT_TIMINGS, ...timings };
    this.config = null;
    this.data = emptyData();
    // The followed events of the last successful cycle, sorted for display.
    this.events = [];
    this.lastSuccessAt = null;
    this.lastCycleAt = -Infinity;
    this.truncated = false;
    // The next cycle takes the followed events as known, firing nothing.
    this.seedNext = false;
    this.house = undefined;
    this.houseReadAt = -Infinity;
    this.statusMessage = undefined;
    this.cycleTimer = null;
    this.running = null;
    this.lastRefreshAt = -Infinity;
    this.refreshTimer = null;
    this.signature = '';
    this.stopped = false;
    // Keys of the failures already logged, so a repeated one is not logged again.
    this.failing = new Set();
  }

  /** Log a failure once (warn or error), then at debug until `recovered(key)`. */
  failed(key, level, message, err) {
    const details = err ? [message, err] : [message];
    if (this.failing.has(key)) {
      logger.debug(...details);
      return;
    }
    this.failing.add(key);
    logger[level](...details);
  }

  /** One line when a failure logged by `failed(key)` is over. */
  recovered(key, message) {
    if (this.failing.delete(key)) {
      logger.info(message);
    }
  }

  // --- Lifecycle -------------------------------------------------------------

  async start(config) {
    this.config = config;
    const saved = await this.store.load();
    if (saved?.version === 1) {
      this.data = { ...emptyData(), ...saved };
    }
    // First start ever: what GDACS lists now is the starting point, not news.
    this.seedNext = !this.data.seeded;
    await this.publishDiscovered();
    this.warnAboutConfig();
    logger.info(`Started: GDACS alerts read every ${config.refreshMinutes} min`);
    this.schedule();
    this.runCycle();
  }

  /** Reconnection: Gladys may have restarted, publish everything again. */
  async resync(config) {
    this.config = config;
    this.houseReadAt = -Infinity;
    await this.publishDiscovered();
    this.statusMessage = undefined;
    await this.updateConnectionStatus();
    this.gladys.forgetPublishedStates?.();
    await this.publishStates();
    this.requestRefresh();
  }

  async reconfigure(config) {
    const languageChanged = config.language !== this.config?.language;
    this.config = config;
    this.houseReadAt = -Infinity;
    // A wider area brings events that are not news.
    this.seedNext = true;
    logger.info('Configuration saved');
    this.warnAboutConfig();
    if (languageChanged) {
      await this.publishDiscovered();
    }
    this.schedule();
    // A cycle already running reads the old configuration: the new one comes after.
    await this.running;
    await this.runCycle();
    this.requestRefresh();
  }

  async stop() {
    this.stopped = true;
    clearInterval(this.cycleTimer);
    clearTimeout(this.refreshTimer);
    this.cycleTimer = null;
    await this.running?.catch(() => {});
    await this.store.flush();
  }

  schedule() {
    if (!this.timers || this.stopped) {
      return;
    }
    clearInterval(this.cycleTimer);
    this.cycleTimer = setInterval(() => this.runCycle(), this.config.refreshMinutes * MINUTE);
    this.cycleTimer.unref?.();
  }

  warnAboutConfig() {
    const { invalidCenter, invalidCountries, eventTypes } = this.config;
    if (invalidCenter) {
      logger.warn('The coordinates of the configuration are not valid: the house is used');
    }
    if (invalidCountries.length > 0) {
      logger.warn(`Not a country code, ignored: ${invalidCountries.join(', ')}`);
    }
    if (eventTypes.length === 0) {
      logger.warn('No event type selected: nothing is followed');
    }
  }

  async publishDiscovered() {
    await this.gladys.publishDiscoveredDevices([buildDevice(this.gladys, this.config.language)]);
  }

  isCreated() {
    const id = deviceIds(this.gladys).device;
    return (this.gladys.devices ?? []).some((device) => device.external_id === id);
  }

  // --- Centre ------------------------------------------------------------------

  /** The centre of the area: the configured coordinates, else the first located house. */
  async center() {
    if (this.config.center) {
      return this.config.center;
    }
    if (this.now() - this.houseReadAt >= this.timings.housesMaxAgeMs) {
      try {
        const houses = await this.gladys.getHouses();
        this.house =
          houses.find(
            (house) => Number.isFinite(house.latitude) && Number.isFinite(house.longitude),
          ) ?? null;
        this.houseReadAt = this.now();
        this.recovered('houses', 'The houses of Gladys are readable again');
      } catch (err) {
        this.failed('houses', 'warn', `Cannot read the houses of Gladys: ${err.message}`);
      }
    }
    return this.house ? { latitude: this.house.latitude, longitude: this.house.longitude } : null;
  }

  // --- Cycles ------------------------------------------------------------------

  runCycle() {
    if (this.running || this.stopped) {
      return this.running;
    }
    this.running = this.cycle()
      .catch((err) => this.failed('cycle', 'error', 'Refresh cycle failed', err))
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  /** The alert levels to ask GDACS for: the minimum level and above. */
  levels() {
    const min = levelRank(this.config.minLevel);
    // Red is the highest level: the worldwide red alerts are always in this list.
    return LEVELS.filter((level) => level.rank >= min).map((level) => level.key);
  }

  async cycle() {
    this.lastCycleAt = this.now();
    let fetched;
    try {
      fetched = await fetchCurrentEvents(this.fetch, {
        types: this.config.eventTypes,
        levels: this.levels(),
        now: this.now(),
      });
      this.recovered('gdacs', 'GDACS answers again');
    } catch (err) {
      this.failed('gdacs', 'warn', `GDACS unreachable: ${err.message}`);
      await this.updateConnectionStatus();
      return;
    }
    this.truncated = fetched.truncated;
    const center = await this.center();
    const followed = this.follow(fetched.events, center);
    logger.debug(
      `Refresh cycle: ${fetched.events.length} current event(s), ${followed.length} followed`,
    );
    await this.detectChanges(fetched.events, followed);
    this.events = followed;
    this.lastSuccessAt = this.now();
    this.recovered('cycle', 'Refresh cycles work again');
    await this.publishStates();
    await this.updateConnectionStatus();
    const signature = followed.map((event) => `${event.key}:${event.level}`).join(',');
    if (signature !== this.signature) {
      this.signature = signature;
      this.requestRefresh();
    }
  }

  /** The events of the followed area, with their distance, sorted for display. */
  follow(events, center) {
    const { radiusKm, countries, worldwideRed, minLevel } = this.config;
    const min = levelRank(minLevel);
    return events
      .map((event) => ({
        ...event,
        distanceKm: center
          ? distanceKm(center.latitude, center.longitude, event.latitude, event.longitude)
          : null,
      }))
      .filter((event) => {
        if (worldwideRed && event.level === 'red') {
          return true;
        }
        if (levelRank(event.level) < min) {
          return false;
        }
        const near = event.distanceKm !== null && event.distanceKm <= radiusKm;
        return near || event.countries.some((code) => countries.includes(code));
      })
      .sort(byLevelThenDistance);
  }

  /** Fire the scene triggers, and remember what was seen. */
  async detectChanges(current, followed) {
    const now = this.now();
    const known = this.data.known;
    const seed = this.seedNext;
    this.seedNext = false;
    const fired = [];
    for (const event of followed) {
      const before = known[event.key];
      if (!before) {
        fired.push({ key: TRIGGERS.NEW, event });
      } else if (levelRank(event.level) > levelRank(before.level)) {
        fired.push({ key: TRIGGERS.RAISED, event, previous: before.level });
      }
      known[event.key] = { level: event.level, seenAt: now };
    }
    // Still listed but out of the area (a cyclone moving away): not forgotten.
    for (const event of current) {
      if (known[event.key]) {
        known[event.key].seenAt = now;
      }
    }
    for (const [key, entry] of Object.entries(known)) {
      if (now - entry.seenAt > this.timings.forgetAfterMs) {
        delete known[key];
      }
    }
    this.data.seeded = true;
    this.store.save(this.data);
    if (seed) {
      logger.debug(`${fired.length} event(s) taken as known, no trigger fired`);
      return;
    }
    for (const [index, change] of fired.entries()) {
      if (index >= MAX_EVENTS_PER_CYCLE) {
        logger.debug(`${fired.length - index} more event(s) not sent to the scenes`);
        break;
      }
      await this.fire(change);
    }
  }

  async fire({ key, event, previous }) {
    const level = LEVEL_NAMES.en[event.level];
    const what = `${headlineOf(event, 'en')}${event.country ? ` · ${placeOf(event, 'en')}` : ''}`;
    const line =
      key === TRIGGERS.NEW
        ? `New ${level.toLowerCase()} alert: ${what}`
        : `Alert raised from ${previous} to ${event.level}: ${what}`;
    // Green alerts are frequent and minor: the logs keep the orange and red ones.
    if (event.level === 'green') {
      logger.debug(line);
    } else {
      logger.info(line);
    }
    try {
      await this.gladys.publishSceneEvent(key, this.eventData(event, previous));
      this.recovered('scene', 'Scene triggers work again');
    } catch (err) {
      this.failed('scene', 'warn', `Firing the scene trigger failed: ${err.message}`);
    }
  }

  /** The flat data of a scene event (fields, then variables of the manifest). */
  eventData(event, previous) {
    const language = this.config.language;
    const data = {
      event_type: event.type,
      level: event.level,
      event_type_name: TYPE_NAMES[language][event.type],
      level_name: LEVEL_NAMES[language][event.level],
      name: headlineOf(event, language),
      country: event.country,
      distance_km: event.distanceKm === null ? null : Math.round(event.distanceKm),
      summary: describe(event, language),
      url: event.url,
    };
    if (previous) {
      data.previous_level = previous;
      data.previous_level_name = LEVEL_NAMES[language][previous];
    }
    return data;
  }

  // --- States ------------------------------------------------------------------

  /** The values of the device, from the last successful cycle. */
  values() {
    const events = this.events;
    const highest = Math.max(0, ...events.map((event) => levelRank(event.level)));
    const latest = events.reduce(
      (newest, event) =>
        newest === null || (event.from ?? 0) > (newest.from ?? 0) ? event : newest,
      null,
    );
    const distances = events.map((event) => event.distanceKm).filter((km) => km !== null);
    return {
      count: events.length,
      highest,
      latest,
      nearestKm: distances.length > 0 ? Math.min(...distances) : null,
    };
  }

  statesOf() {
    if (this.lastSuccessAt === null) {
      return [];
    }
    const ids = deviceIds(this.gladys);
    const language = this.config.language;
    const { count, highest, latest, nearestKm } = this.values();
    const states = [
      { device_feature_external_id: ids.count, state: count },
      { device_feature_external_id: ids.level, state: highest },
      {
        device_feature_external_id: ids.latest,
        text: latest ? describe(latest, language) : PHRASES[language].none,
      },
    ];
    // Without a centre there is no distance: nothing published rather than a false one.
    if (nearestKm !== null || this.config.center || this.house) {
      states.push({
        device_feature_external_id: ids.distance,
        state: nearestKm === null ? NO_EVENT_KM : Math.round(nearestKm * 10) / 10,
      });
    }
    return states;
  }

  async publishStates() {
    if (!this.isCreated()) {
      return;
    }
    const states = this.statesOf();
    if (states.length === 0) {
      return;
    }
    try {
      await this.gladys.publishChangedStates(states, { heartbeat: this.timings.heartbeatMs });
      this.recovered('publish', 'Publishing the states works again');
    } catch (err) {
      // Sent again at the next cycle (the SDK forgets what Gladys refused).
      this.failed('publish', 'warn', `Publishing the states failed: ${err.message}`);
    }
  }

  async updateConnectionStatus() {
    const parts = [];
    if (this.failing.has('gdacs')) {
      parts.push(render(STATUS, 'gdacsDown'));
    }
    if (this.config.eventTypes.length === 0) {
      parts.push(render(STATUS, 'noType'));
    }
    if (!this.config.center && !this.house) {
      parts.push(render(STATUS, 'noCenter'));
    } else if (this.config.invalidCenter) {
      parts.push(render(STATUS, 'invalidCenter'));
    }
    if (this.config.invalidCountries.length > 0) {
      parts.push(
        render(STATUS, 'invalidCountries', { values: this.config.invalidCountries.join(', ') }),
      );
    }
    if (this.truncated) {
      parts.push(render(STATUS, 'truncated'));
    }
    const message = parts.length > 0 ? join(...parts) : undefined;
    const connected = !this.failing.has('gdacs') && this.lastSuccessAt !== null;
    const key = JSON.stringify([connected, message]);
    if (key === this.statusMessage) {
      return;
    }
    this.statusMessage = key;
    await this.gladys.setConnectionStatus(connected, message).catch(() => {});
  }

  // --- Gladys events -----------------------------------------------------------

  async onDeviceCreated(device) {
    if (device?.external_id !== deviceIds(this.gladys).device) {
      return;
    }
    if (this.lastSuccessAt === null) {
      await this.runCycle();
    }
    // The SDK forgot the states of the device: everything is published again.
    await this.publishStates();
    this.requestRefresh();
  }

  /** onPoll fallback: should_poll is false, but a Gladys polling anyway gets an answer. */
  async poll(device) {
    if (device?.external_id !== deviceIds(this.gladys).device) {
      return;
    }
    // Read again only if the last cycle is older than half the interval.
    if (this.now() - this.lastCycleAt >= (this.config.refreshMinutes * MINUTE) / 2) {
      await this.runCycle();
    } else {
      await this.publishStates();
    }
  }

  /** The followed events, read again if the last cycle is older than one interval. */
  async fresh() {
    if (this.now() - this.lastCycleAt >= this.config.refreshMinutes * MINUTE) {
      await this.runCycle();
    } else {
      await this.running;
    }
    return { events: this.events, ok: this.lastSuccessAt !== null };
  }

  // --- Widget -------------------------------------------------------------------

  requestRefresh() {
    if (this.stopped) {
      return;
    }
    const now = this.now();
    const wait = this.lastRefreshAt + this.timings.widgetRefreshMs - now;
    if (wait <= 0) {
      this.lastRefreshAt = now;
      this.gladys.requestWidgetRefresh(WIDGET_KEY);
    } else if (this.timers && !this.refreshTimer) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTimer = null;
        this.requestRefresh();
      }, wait);
      this.refreshTimer.unref?.();
    }
  }
}

function emptyData() {
  return { version: 1, seeded: false, known: {} };
}
