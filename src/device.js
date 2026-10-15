// -----------------------------------------------------------------------------
// The one Gladys device of the integration: the GDACS alerts of the followed
// area (the radius around the centre, the chosen countries, and the red alerts
// of the whole world when asked).
//
// Features (couples checked against the Gladys front, see
// test/gladys-rules.test.js):
//   - alert_count       counter-sensor/integer: the followed current events;
//   - highest_level     risk/integer: 0 no alert, 1 green, 2 orange, 3 red.
//                       The front draws its risk badge (0 "no risk" … 3
//                       "high"), the colours of GDACS shifted by one;
//   - latest_event      text/text: the newest followed event, in words;
//   - nearest_distance  distance-sensor/decimal, km: the nearest followed
//                       event. Without any, NO_EVENT_KM (half the
//                       circumference of the Earth, the farthest a point can
//                       be): a "below 500 km" condition stays false.
//
// Published with should_poll: false: the refresh runs in the container
// (src/monitor.js). The platform id is fixed: there is one area per Gladys.
// -----------------------------------------------------------------------------

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES as TYPES,
  DEVICE_FEATURE_UNITS,
} from '@gladysassistant/integration-sdk';

export const DEVICE_TYPE = 'alerts';
export const PLATFORM_ID = 'area';
export const FEATURE_KEYS = {
  COUNT: 'alert_count',
  LEVEL: 'highest_level',
  LATEST: 'latest_event',
  DISTANCE: 'nearest_distance',
};

export const NO_EVENT_KM = 20038;
export const MAX_COUNT = 10000;

// Feature names, frozen at creation in Gladys (language of the configuration).
export const NAMES = {
  en: {
    device: 'GDACS alerts',
    alert_count: 'Active alerts',
    highest_level: 'Highest alert level',
    latest_event: 'Latest event',
    nearest_distance: 'Nearest event distance',
  },
  fr: {
    device: 'Alertes GDACS',
    alert_count: 'Alertes en cours',
    highest_level: "Niveau d'alerte le plus haut",
    latest_event: 'Dernier événement',
    nearest_distance: "Distance de l'événement le plus proche",
  },
  de: {
    device: 'GDACS-Warnungen',
    alert_count: 'Aktive Warnungen',
    highest_level: 'Höchste Warnstufe',
    latest_event: 'Neuestes Ereignis',
    nearest_distance: 'Entfernung des nächsten Ereignisses',
  },
  es: {
    device: 'Alertas GDACS',
    alert_count: 'Alertas activas',
    highest_level: 'Nivel de alerta más alto',
    latest_event: 'Último evento',
    nearest_distance: 'Distancia del evento más cercano',
  },
};

/** External ids of the device and of its features. */
export function deviceIds(gladys) {
  const ids = gladys.externalIds(DEVICE_TYPE, PLATFORM_ID);
  return {
    device: ids.device,
    count: ids.feature(FEATURE_KEYS.COUNT),
    level: ids.feature(FEATURE_KEYS.LEVEL),
    latest: ids.feature(FEATURE_KEYS.LATEST),
    distance: ids.feature(FEATURE_KEYS.DISTANCE),
  };
}

const sensor = (name, externalId, category, type, extra) => ({
  name,
  external_id: externalId,
  category,
  type,
  read_only: true,
  has_feedback: false,
  ...extra,
});

/** The discovery payload of the device. */
export function buildDevice(gladys, language = 'fr') {
  const ids = deviceIds(gladys);
  const names = NAMES[language] ?? NAMES.fr;
  return {
    name: names.device,
    external_id: ids.device,
    model: 'GDACS',
    should_poll: false,
    params: [],
    features: [
      sensor(
        names.alert_count,
        ids.count,
        DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR,
        TYPES.SENSOR.INTEGER,
        { keep_history: true, min: 0, max: MAX_COUNT },
      ),
      sensor(names.highest_level, ids.level, DEVICE_FEATURE_CATEGORIES.RISK, TYPES.RISK.INTEGER, {
        keep_history: true,
        min: 0,
        max: 3,
      }),
      sensor(names.latest_event, ids.latest, DEVICE_FEATURE_CATEGORIES.TEXT, TYPES.TEXT.TEXT, {
        keep_history: false,
        min: 0,
        max: 0,
      }),
      sensor(
        names.nearest_distance,
        ids.distance,
        DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR,
        TYPES.SENSOR.DECIMAL,
        { unit: DEVICE_FEATURE_UNITS.KM, keep_history: true, min: 0, max: NO_EVENT_KM },
      ),
    ],
  };
}
