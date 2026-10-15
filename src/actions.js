// -----------------------------------------------------------------------------
// The scene action `read_alerts` and the configuration action `check_now`.
// Both read GDACS again when the last cycle is older than one interval, and
// answer with the alerts of the followed area as one sentence: something a
// scene can send by message or read aloud, highest level first, then nearest.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { LANGUAGES, LEVELS, levelRank } from './config.js';
import { STATUS, formatTime, render, sentence } from './messages.js';

const logger = createLogger({ name: 'gdacs-actions' });

export const SCENE_ACTION = 'read_alerts';
export const CONFIG_ACTION = 'check_now';

/** The highest level of the events as its stable key: none, green, orange, red. */
export function highestLevel(events) {
  const rank = Math.max(0, ...events.map((event) => levelRank(event.level)));
  return LEVELS.find((level) => level.rank === rank)?.key ?? 'none';
}

/** Scene action: outputs `text`, `count` and `max_level`; throws if GDACS never answered. */
export async function readAlerts(monitor) {
  const { events, ok } = await monitor.fresh();
  if (!ok) {
    throw new Error(render(STATUS, 'gdacsDown')[monitor.config.language]);
  }
  return {
    text: sentence(events, monitor.config.language),
    count: events.length,
    max_level: highestLevel(events),
  };
}

/** Configuration action: the alerts of the area now, in every language. */
export async function checkNow(monitor) {
  const { events, ok } = await monitor.fresh();
  logger.info(
    `Check requested: ${ok ? `${events.length} alert(s) followed` : 'GDACS unreachable'}`,
  );
  if (!ok) {
    return render(STATUS, 'gdacsDown');
  }
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      render(STATUS, 'summary', {
        text: sentence(events, language),
        time: formatTime(monitor.lastSuccessAt, language),
      })[language],
    ]),
  );
}
