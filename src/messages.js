// -----------------------------------------------------------------------------
// Texts sent from the container (feature values, connection status, action and
// scene messages, scene variables), in the four languages of the Gladys
// interface. Entries are strings or functions of one parameter object. German
// says "du", Spanish "usted". Country and event names come from GDACS, in
// English: they are not translated.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { LANGUAGES } from './config.js';

export const TYPE_NAMES = {
  en: {
    earthquake: 'Earthquake',
    tropical_cyclone: 'Tropical cyclone',
    flood: 'Flood',
    volcano: 'Volcanic eruption',
    drought: 'Drought',
    wildfire: 'Forest fire',
  },
  fr: {
    earthquake: 'Séisme',
    tropical_cyclone: 'Cyclone tropical',
    flood: 'Inondation',
    volcano: 'Éruption volcanique',
    drought: 'Sécheresse',
    wildfire: 'Feu de forêt',
  },
  de: {
    earthquake: 'Erdbeben',
    tropical_cyclone: 'Tropischer Wirbelsturm',
    flood: 'Überschwemmung',
    volcano: 'Vulkanausbruch',
    drought: 'Dürre',
    wildfire: 'Waldbrand',
  },
  es: {
    earthquake: 'Terremoto',
    tropical_cyclone: 'Ciclón tropical',
    flood: 'Inundación',
    volcano: 'Erupción volcánica',
    drought: 'Sequía',
    wildfire: 'Incendio forestal',
  },
};

export const LEVEL_NAMES = {
  en: { none: 'None', green: 'Green', orange: 'Orange', red: 'Red' },
  fr: { none: 'Aucune', green: 'Vert', orange: 'Orange', red: 'Rouge' },
  de: { none: 'Keine', green: 'Grün', orange: 'Orange', red: 'Rot' },
  es: { none: 'Ninguna', green: 'Verde', orange: 'Naranja', red: 'Rojo' },
};

/**
 * Colour of a level in the closed widget palette. `info` for green: in GDACS
 * green means "no international assistance needed", not "all is well".
 */
export const LEVEL_COLORS = {
  green: WIDGET_COLORS.INFO,
  orange: WIDGET_COLORS.WARNING,
  red: WIDGET_COLORS.DANGER,
};

// Values of the "Latest event" feature, and pieces of sentences.
export const PHRASES = {
  en: {
    none: 'No active alert',
    item: ({ what, place, km }) =>
      `${what}${place ? ` in ${place}` : ''}${km === null ? '' : `, ${km} km away`}`,
    list: ({ head, items }) => `${head}: ${items.join('; ')}.`,
    more: ({ count }) => `and ${count} more`,
    alerts: ({ count }) => (count === 1 ? '1 GDACS alert' : `${count} GDACS alerts`),
    noAlert: 'No GDACS alert in your area.',
    others: ({ count }) => `+${count}`,
  },
  fr: {
    none: 'Aucune alerte en cours',
    item: ({ what, place, km }) =>
      `${what}${place ? ` (${place})` : ''}${km === null ? '' : `, à ${km} km`}`,
    list: ({ head, items }) => `${head} : ${items.join(' ; ')}.`,
    more: ({ count }) => `et ${count} de plus`,
    alerts: ({ count }) => (count === 1 ? '1 alerte GDACS' : `${count} alertes GDACS`),
    noAlert: 'Aucune alerte GDACS dans votre zone.',
    others: ({ count }) => `+${count}`,
  },
  de: {
    none: 'Keine aktive Warnung',
    item: ({ what, place, km }) =>
      `${what}${place ? ` in ${place}` : ''}${km === null ? '' : `, ${km} km entfernt`}`,
    list: ({ head, items }) => `${head}: ${items.join('; ')}.`,
    more: ({ count }) => `und ${count} weitere`,
    alerts: ({ count }) => (count === 1 ? '1 GDACS-Warnung' : `${count} GDACS-Warnungen`),
    noAlert: 'Keine GDACS-Warnung in deinem Gebiet.',
    others: ({ count }) => `+${count}`,
  },
  es: {
    none: 'Ninguna alerta activa',
    item: ({ what, place, km }) =>
      `${what}${place ? ` en ${place}` : ''}${km === null ? '' : `, a ${km} km`}`,
    list: ({ head, items }) => `${head}: ${items.join('; ')}.`,
    more: ({ count }) => `y ${count} más`,
    alerts: ({ count }) => (count === 1 ? '1 alerta GDACS' : `${count} alertas GDACS`),
    noAlert: 'Ninguna alerta GDACS en su zona.',
    others: ({ count }) => `+${count}`,
  },
};

// Connection status of the Configuration screen, and messages of the actions.
export const STATUS = {
  en: {
    initFailed: 'Initialization failed, check the integration logs.',
    gdacsDown: 'GDACS does not answer: the alerts are not updated.',
    noCenter:
      'No centre: give your house a location in Gladys (Settings, Houses) or type coordinates.',
    invalidCenter: 'The coordinates are not valid: the location of your house is used.',
    invalidCountries: ({ values }) => `Ignored (not a country code): ${values}.`,
    noType: 'No event type selected: nothing is followed.',
    truncated: 'GDACS lists too many events: raise the minimum level or narrow the types.',
    summary: ({ text, time }) => `${text} Checked at ${time}.`,
  },
  fr: {
    initFailed: "L'initialisation a échoué, consultez les logs de l'intégration.",
    gdacsDown: 'GDACS ne répond pas : les alertes ne sont pas mises à jour.',
    noCenter:
      'Aucun centre : indiquez la position de votre maison dans Gladys (Paramètres, Maisons) ou saisissez des coordonnées.',
    invalidCenter:
      'Les coordonnées ne sont pas valides : la position de votre maison est utilisée.',
    invalidCountries: ({ values }) => `Ignoré (pas un code de pays) : ${values}.`,
    noType: "Aucun type d'événement choisi : rien n'est suivi.",
    truncated:
      "GDACS liste trop d'événements : relevez le niveau minimal ou réduisez les types suivis.",
    summary: ({ text, time }) => `${text} Vérifié à ${time}.`,
  },
  de: {
    initFailed: 'Initialisierung fehlgeschlagen, sieh dir die Protokolle der Integration an.',
    gdacsDown: 'GDACS antwortet nicht: Die Warnungen werden nicht aktualisiert.',
    noCenter:
      'Kein Mittelpunkt: Gib deinem Haus in Gladys einen Standort (Einstellungen, Häuser) oder trage Koordinaten ein.',
    invalidCenter: 'Die Koordinaten sind ungültig: Der Standort deines Hauses wird verwendet.',
    invalidCountries: ({ values }) => `Ignoriert (kein Ländercode): ${values}.`,
    noType: 'Kein Ereignistyp gewählt: Nichts wird verfolgt.',
    truncated:
      'GDACS listet zu viele Ereignisse: Erhöhe die Mindeststufe oder wähle weniger Typen.',
    summary: ({ text, time }) => `${text} Geprüft um ${time}.`,
  },
  es: {
    initFailed: 'La inicialización ha fallado, consulte los registros de la integración.',
    gdacsDown: 'GDACS no responde: las alertas no se actualizan.',
    noCenter:
      'Sin centro: indique la ubicación de su casa en Gladys (Ajustes, Casas) o introduzca coordenadas.',
    invalidCenter: 'Las coordenadas no son válidas: se usa la ubicación de su casa.',
    invalidCountries: ({ values }) => `Ignorado (no es un código de país): ${values}.`,
    noType: 'Ningún tipo de evento elegido: no se sigue nada.',
    truncated: 'GDACS enumera demasiados eventos: suba el nivel mínimo o reduzca los tipos.',
    summary: ({ text, time }) => `${text} Comprobado a las ${time}.`,
  },
};

/** One entry of a message table, in every language: `{ en, fr, de, es }`. */
export function render(table, key, params = {}) {
  return Object.fromEntries(
    LANGUAGES.map((language) => {
      const entry = table[language][key];
      return [language, typeof entry === 'function' ? entry(params) : entry];
    }),
  );
}

/** Several multi-language texts joined, language by language. */
export function join(...messages) {
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      messages
        .filter(Boolean)
        .map((message) => message[language])
        .join(' '),
    ]),
  );
}

const locale = (language) => (language === 'en' ? 'en-GB' : language);

/** A date in the user's time zone (TZ, set by the Gladys supervisor), e.g. "13/10 18:35". */
export function formatDate(time, language) {
  return new Intl.DateTimeFormat(locale(language), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time));
}

/** A time of day, e.g. "18:35". */
export function formatTime(time, language) {
  return new Intl.DateTimeFormat(locale(language), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time));
}

/** A number in the user's language, e.g. "1 234" or "4,5" in French. */
export function formatNumber(value, language, digits = 0) {
  return new Intl.NumberFormat(locale(language), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** "Austria, Belgium +27" for an event over many countries. */
export function placeOf(event, language) {
  const names = event.country
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.length <= 2) {
    return names.join(', ');
  }
  return `${names.slice(0, 2).join(', ')} ${PHRASES[language].others({ count: names.length - 2 })}`;
}

/** The magnitude of an event, as GDACS rates it: "M5.6", "250 km/h", "10 210 ha"; '' if none. */
export function magnitudeOf(event, language) {
  const { severity, severityUnit } = event;
  if (severity === null || severity <= 0) {
    return '';
  }
  switch (event.type) {
    case 'earthquake':
      return `M${formatNumber(severity, language, 1)}`;
    case 'tropical_cyclone':
      return `${formatNumber(severity, language)} km/h`;
    case 'wildfire':
      return severityUnit === 'ha' ? `${formatNumber(severity, language)} ha` : '';
    default:
      return '';
  }
}

/** "Tropical cyclone SIMON-26 250 km/h", "Earthquake M5.6", "Drought Europe-2026". */
export function headlineOf(event, language) {
  return [TYPE_NAMES[language][event.type], event.name, magnitudeOf(event, language)]
    .filter(Boolean)
    .join(' ');
}

const km = (distance, language) => formatNumber(Math.round(distance), language);

/**
 * The value of the "Latest event" feature, e.g.
 * "Orange · Tropical cyclone SIMON-26 250 km/h · México · 2,345 km".
 */
export function describe(event, language) {
  return [
    LEVEL_NAMES[language][event.level],
    headlineOf(event, language),
    placeOf(event, language),
    // No distance without a centre (countries and worldwide red alerts only).
    event.distanceKm === null ? '' : `${km(event.distanceKm, language)} km`,
  ]
    .filter(Boolean)
    .join(' · ');
}

// Events named in one sentence: a scene that reads it aloud stays short.
export const SENTENCE_EVENTS = 5;

/**
 * The alerts as one sentence, e.g. "2 GDACS alerts: Orange · Tropical cyclone
 * SIMON-26 250 km/h in México, 2,345 km away; Green · Earthquake M4.5 in
 * Panama, 172 km away." Events sorted already (level, then distance).
 */
export function sentence(events, language) {
  const p = PHRASES[language];
  if (events.length === 0) {
    return p.noAlert;
  }
  const parts = events.slice(0, SENTENCE_EVENTS).map((event) =>
    p.item({
      what: `${LEVEL_NAMES[language][event.level]} · ${headlineOf(event, language)}`,
      place: placeOf(event, language),
      km: event.distanceKm === null ? null : km(event.distanceKm, language),
    }),
  );
  const rest = events.length - SENTENCE_EVENTS;
  if (rest > 0) {
    parts.push(p.more({ count: rest }));
  }
  return p.list({ head: p.alerts({ count: events.length }), items: parts });
}
