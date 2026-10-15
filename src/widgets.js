// -----------------------------------------------------------------------------
// Dashboard widget (manifest `widgets`, Gladys 5.1+): `alerts`.
//
// A heading with the number of alerts, then the followed events as a
// `card-list` (8 rows at most, the core's cap), highest level first, then
// nearest: the type and magnitude as title, the country and distance as
// subtitle, the level as a coloured badge. Tapping a row opens the core's
// detail panel: the GDACS description of the event, its dates, and a link to
// its GDACS report. The footer gives the source and the time of the last
// reading (GDACS asks to be cited), and a link to gdacs.org.
// Budget: 2 texts, 1 card-list, 1 button.
// -----------------------------------------------------------------------------

import { GDACS_SITE } from './gdacs.js';
import {
  LEVEL_COLORS,
  LEVEL_NAMES,
  formatDate,
  formatNumber,
  headlineOf,
  placeOf,
} from './messages.js';
import { WIDGET_KEY } from './monitor.js';

export const MAX_ITEMS = 8;
export const TTL_SECONDS = 300;

export const TEXT = {
  waiting: {
    en: 'Waiting for GDACS…',
    fr: 'En attente de GDACS…',
    de: 'Warte auf GDACS…',
    es: 'Esperando a GDACS…',
  },
  none: {
    en: 'No GDACS alert',
    fr: 'Aucune alerte GDACS',
    de: 'Keine GDACS-Warnung',
    es: 'Ninguna alerta GDACS',
  },
  one: { en: '1 GDACS alert', fr: '1 alerte GDACS', de: '1 GDACS-Warnung', es: '1 alerta GDACS' },
  many: {
    en: ' GDACS alerts',
    fr: ' alertes GDACS',
    de: ' GDACS-Warnungen',
    es: ' alertas GDACS',
  },
  shown: { en: ' shown', fr: ' affichées', de: ' angezeigt', es: ' mostradas' },
  source: { en: 'Source: GDACS', fr: 'Source : GDACS', de: 'Quelle: GDACS', es: 'Fuente: GDACS' },
  report: {
    en: 'GDACS report',
    fr: 'Rapport GDACS',
    de: 'GDACS-Bericht',
    es: 'Informe GDACS',
  },
  from: { en: 'From', fr: 'Du', de: 'Vom', es: 'Desde' },
  to: { en: 'to', fr: 'au', de: 'bis', es: 'hasta' },
  site: { en: 'GDACS', fr: 'GDACS', de: 'GDACS', es: 'GDACS' },
};

const t = (text, language) => text[language] ?? text.en;
const clip = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1)}…`);

function heading(events, language) {
  if (events.length === 0) {
    return t(TEXT.none, language);
  }
  if (events.length === 1) {
    return t(TEXT.one, language);
  }
  const shown = events.length > MAX_ITEMS ? ` (${MAX_ITEMS}${t(TEXT.shown, language)})` : '';
  return `${events.length}${t(TEXT.many, language)}${shown}`;
}

/** One row of the list, and its detail panel. */
export function itemOf(event, language) {
  const place = placeOf(event, language);
  const distance =
    event.distanceKm === null ? null : `${formatNumber(Math.round(event.distanceKm), language)} km`;
  const dates =
    event.from !== null && event.to !== null && event.to - event.from >= 60 * 1000
      ? `${t(TEXT.from, language)} ${formatDate(event.from, language)} ${t(TEXT.to, language)} ${formatDate(event.to, language)}`
      : event.from !== null
        ? formatDate(event.from, language)
        : null;
  return {
    title: clip(headlineOf(event, language), 60),
    subtitle: clip([place, distance].filter(Boolean).join(' · '), 60),
    badge: { text: LEVEL_NAMES[language][event.level], color: LEVEL_COLORS[event.level] },
    // GDACS writes its descriptions in English: shown as they are.
    description: [event.title, event.severityText, dates].filter(Boolean).join('\n'),
    links: [{ url: event.url, label: t(TEXT.report, language) }],
  };
}

export const WIDGETS = {
  [WIDGET_KEY]: {
    async get(monitor, { language = 'en' } = {}) {
      const lang = LEVEL_NAMES[language] ? language : 'en';
      const updated = monitor.lastSuccessAt;
      const source = t(TEXT.source, lang);
      const components = [
        {
          type: 'text',
          variant: 'heading',
          text: updated === null ? t(TEXT.waiting, lang) : heading(monitor.events, lang),
        },
      ];
      if (monitor.events.length > 0) {
        components.push({
          type: 'card-list',
          display: 'list',
          items: monitor.events.slice(0, MAX_ITEMS).map((event) => itemOf(event, lang)),
        });
      }
      components.push(
        {
          type: 'text',
          variant: 'caption',
          text: updated === null ? source : `${source} · ${formatDate(updated, lang)}`,
        },
        {
          type: 'button',
          label: t(TEXT.site, lang),
          icon: 'external-link',
          link: { url: GDACS_SITE },
        },
      );
      return { ttl_seconds: TTL_SECONDS, components };
    },
  },
};
