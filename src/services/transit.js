/**
 * @module transit
 * @description Dynamic transit schedule service for PitchSync AI.
 *
 * Generates and manages departure schedules for metro, bus, event
 * shuttle, and rideshare services near the stadium. Schedules are
 * cached in the L1 memory layer for 60 seconds to prevent excessive
 * regeneration.
 *
 * Supports crowd-aware surge scheduling: when overall density
 * exceeds 80%, extra "surge" departures are injected to model
 * real-world transit-authority coordination.
 */

import { generateTransitSchedules, TRANSIT_MODES } from '../utils/constants.js';
import { memGet, memSet } from '../core/cache.js';

const CACHE_KEY = 'transit_schedules';
const CACHE_TTL = 60000; // 1 minute

let schedulesCache = null;

/**
 * Get current transit schedules
 * Uses caching to prevent excessive regeneration
 * @returns {Array}
 */
export function getSchedule() {
  // Check memory cache first
  const cached = memGet(CACHE_KEY);
  if (cached) return cached;

  // Generate fresh schedules
  const schedules = generateTransitSchedules();

  // Cache for 1 minute
  memSet(CACHE_KEY, schedules, CACHE_TTL);
  schedulesCache = schedules;

  return schedules;
}

/**
 * Get schedules filtered by transit mode
 * @param {string} mode - 'metro', 'bus', 'shuttle', 'rideshare'
 * @returns {Array}
 */
export function getScheduleByMode(mode) {
  return getSchedule().filter(s => s.mode === mode);
}

/**
 * Get the next departure for a specific mode
 * @param {string} mode
 * @returns {object|null}
 */
export function getNextDeparture(mode) {
  const now = new Date();
  return getScheduleByMode(mode).find(s => new Date(s.departure) > now) || null;
}

/**
 * Adjust schedule frequency based on crowd density
 * Higher density → more frequent departures
 * @param {number} densityPercent - Current overall crowd density (0-100)
 * @returns {Array} Adjusted schedules
 */
export function getAdjustedSchedule(densityPercent) {
  const schedules = getSchedule();

  if (densityPercent > 80) {
    // Surge mode: add extra departures
    const extras = [];
    for (const s of schedules.slice(0, 3)) {
      const surgeDeparture = new Date(new Date(s.departure).getTime() + 3 * 60000);
      extras.push({
        ...s,
        id: `${s.id}_surge`,
        departure: surgeDeparture.toISOString(),
        line: `${s.line} (Surge)`,
        delay: 0,
      });
    }
    return [...schedules, ...extras].sort((a, b) => new Date(a.departure) - new Date(b.departure));
  }

  return schedules;
}

/**
 * Simulate a transit delay
 * @param {string} scheduleId
 * @param {number} delayMinutes
 * @returns {object|null} Updated schedule entry
 */
export function simulateDelay(scheduleId, delayMinutes) {
  const schedules = getSchedule();
  const entry = schedules.find(s => s.id === scheduleId);
  if (entry) {
    entry.delay = delayMinutes;
    memSet(CACHE_KEY, schedules, CACHE_TTL);
    return entry;
  }
  return null;
}

/**
 * Get transit mode info
 * @param {string} mode
 * @returns {object}
 */
export function getTransitMode(mode) {
  return TRANSIT_MODES[mode] || { icon: '🚌', name: mode, color: '#6B7280' };
}

/**
 * Format departure countdown
 * @param {string} departureISO - ISO date string
 * @returns {{ minutes: number, text: string, isUrgent: boolean }}
 */
export function getDepartureCountdown(departureISO) {
  const now = new Date();
  const departure = new Date(departureISO);
  const diffMs = departure - now;
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  let text;
  if (minutes === 0) text = 'Departing now';
  else if (minutes === 1) text = '1 min';
  else text = `${minutes} min`;

  return { minutes, text, isUrgent: minutes <= 3 };
}

