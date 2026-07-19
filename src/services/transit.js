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
 * Get current transit departure schedules with L1 memory caching.
 *
 * @returns {Array<{ id: string, mode: string, line: string, destination: string, departure: string, delay: number, accessible: boolean, capacity: number }>} Array of departure schedules
 *
 * @example
 * const schedules = getSchedule();
 */
export function getSchedule() {
  const cached = memGet(CACHE_KEY);
  if (cached) return cached;

  const schedules = generateTransitSchedules();
  memSet(CACHE_KEY, schedules, CACHE_TTL);
  schedulesCache = schedules;

  return schedules;
}

/**
 * Get transit schedules filtered by transit mode category.
 *
 * @param {'metro'|'bus'|'shuttle'|'rideshare'} mode - Transit mode identifier
 * @returns {Array<object>} Filtered departure schedules
 *
 * @example
 * const shuttles = getScheduleByMode('shuttle');
 */
export function getScheduleByMode(mode) {
  return getSchedule().filter(s => s.mode === mode);
}

/**
 * Get the next immediate departure schedule for a given transit mode.
 *
 * @param {'metro'|'bus'|'shuttle'|'rideshare'} mode - Transit mode ID
 * @returns {object|null} Next upcoming departure schedule or null if none available
 */
export function getNextDeparture(mode) {
  const now = new Date();
  return getScheduleByMode(mode).find(s => new Date(s.departure) > now) || null;
}

/**
 * Calculate human-readable departure countdown text and urgency indicator.
 *
 * @param {string|Date} departureTime - Departure time ISO string or Date
 * @returns {{ text: string, minutes: number, isUrgent: boolean }} Countdown object
 *
 * @example
 * getDepartureCountdown('2026-06-11T21:45:00');
 * // => { text: '12m', minutes: 12, isUrgent: false }
 */
export function getDepartureCountdown(departureTime) {
  const dep = new Date(departureTime);
  const now = new Date();
  const diffMs = dep - now;
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  let text = `${minutes}m`;
  if (minutes === 0) text = 'Now';
  else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    text = `${hours}h ${remainingMins}m`;
  }

  return {
    text,
    minutes,
    isUrgent: minutes <= 5,
  };
}

/**
 * Get transit mode configuration details (icon, name, accent color).
 *
 * @param {string} mode - Transit mode string ID
 * @returns {{ icon: string, name: string, color: string }} Mode details object
 */
export function getTransitMode(mode) {
  return TRANSIT_MODES[mode] || { icon: '🚌', name: 'Transit', color: '#1E40AF' };
}

/**
 * Adjust transit schedules for high crowd density surges (injecting extra shuttles).
 *
 * @param {number} overallDensity - Overall stadium crowd density percentage
 * @returns {Array<object>} Surge-adjusted schedule array
 */
export function getAdjustedSchedule(overallDensity) {
  const baseSchedules = getSchedule();
  if (overallDensity < 80) return baseSchedules;

  // Add surge shuttles during high density
  const surgeTime = new Date(Date.now() + 5 * 60000).toISOString();
  const surgeShuttle = {
    id: 'surge_shuttle_1',
    mode: 'shuttle',
    line: '⚡ Express Surge Shuttle',
    destination: 'Secaucus Junction (Direct)',
    departure: surgeTime,
    delay: 0,
    accessible: true,
    capacity: 20,
    surge: true,
  };

  return [surgeShuttle, ...baseSchedules];
}

/**
 * Simulate a delay update for a specific transit schedule entry.
 *
 * @param {string} scheduleId - Transit schedule ID
 * @param {number} delayMinutes - Delay duration in minutes
 */
export function simulateDelay(scheduleId, delayMinutes) {
  const schedules = getSchedule();
  const target = schedules.find(s => s.id === scheduleId);
  if (target) {
    target.delay = delayMinutes;
    memSet(CACHE_KEY, schedules, CACHE_TTL);
  }
}
