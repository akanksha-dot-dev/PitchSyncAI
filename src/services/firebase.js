/**
 * @module firebase
 * @description Mocked Firebase/Firestore real-time service for PitchSync AI.
 *
 * Simulates Firestore `onSnapshot` listeners for crowd-density data
 * and operational alerts. Crowd data evolves via smooth ±5% transitions
 * per 5-second tick, modelling realistic stadium dynamics without
 * requiring real sensor infrastructure.
 *
 * Alert simulation generates random ops alerts every 8–15 seconds
 * using templates that reference actual stadium zones.
 *
 * Each mock service is a drop-in replacement — swap the internals
 * with real Firebase SDK clients without modifying any component code.
 */

import { generateCrowdData, OPS_ALERT_TEMPLATES } from '../utils/constants.js';

/** @type {Map<string, Function>} */
const crowdSubscribers = new Map();

/** @type {Map<string, Function>} */
const alertSubscribers = new Map();

let crowdInterval = null;
let alertInterval = null;
let currentCrowdData = generateCrowdData();
let alertCounter = 0;

/**
 * Subscribe to real-time crowd density updates. Simulates Firestore onSnapshot listener.
 *
 * @param {Function} callback - (crowdData) => void
 * @returns {Function} Unsubscribe cleanup function
 *
 * @example
 * const unsub = subscribeToCrowdData((data) => console.log(data));
 * // Later: unsub();
 */
export function subscribeToCrowdData(callback) {
  const id = `crowd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  crowdSubscribers.set(id, callback);

  callback(currentCrowdData);

  if (!crowdInterval) {
    startCrowdSimulation();
  }

  return () => {
    crowdSubscribers.delete(id);
    if (crowdSubscribers.size === 0) {
      stopCrowdSimulation();
    }
  };
}

/**
 * Subscribe to real-time ops alert updates.
 *
 * @param {Function} callback - (alert) => void
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToAlerts(callback) {
  const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  alertSubscribers.set(id, callback);

  if (!alertInterval) {
    startAlertSimulation();
  }

  return () => {
    alertSubscribers.delete(id);
    if (alertSubscribers.size === 0) {
      stopAlertSimulation();
    }
  };
}

/**
 * Start crowd density data tick simulation.
 */
function startCrowdSimulation() {
  crowdInterval = setInterval(() => {
    // Evolve density values smoothly (±5% per tick)
    const updated = {};
    for (const [zoneId, info] of Object.entries(currentCrowdData)) {
      const delta = (Math.random() - 0.48) * 6; // Slight upward bias
      const newDensity = Math.max(10, Math.min(98, Math.round(info.density + delta)));

      const trend = newDensity > info.density + 1 ? 'rising' :
                    newDensity < info.density - 1 ? 'falling' : 'stable';

      updated[zoneId] = {
        ...info,
        density: newDensity,
        trend,
        count: Math.round((newDensity / 100) * info.capacity),
        timestamp: Date.now(),
      };
    }

    currentCrowdData = updated;

    for (const fn of crowdSubscribers.values()) {
      try {
        fn(currentCrowdData);
      } catch (err) {
        // Silent catch for subscriber errors
      }
    }
  }, 5000);
}

/**
 * Stop crowd simulation timer.
 */
function stopCrowdSimulation() {
  if (crowdInterval) {
    clearInterval(crowdInterval);
    crowdInterval = null;
  }
}

/**
 * Start ops alert generator simulation.
 */
function startAlertSimulation() {
  alertInterval = setInterval(() => {
    const template = OPS_ALERT_TEMPLATES[Math.floor(Math.random() * OPS_ALERT_TEMPLATES.length)];
    const zones = Object.keys(currentCrowdData);
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    const zoneInfo = currentCrowdData[randomZone];

    // Only alert if density is high enough for the severity
    const density = zoneInfo?.density || 50;
    if (template.severity === 'critical' && density < 75) return;
    if (template.severity === 'warning' && density < 60) return;

    alertCounter++;
    const alert = {
      id: `alert_${alertCounter}_${Date.now()}`,
      title: template.title,
      description: template.template.replace('{zone}', zoneInfo?.zoneName || randomZone),
      severity: template.severity,
      zone: randomZone,
      timestamp: Date.now(),
      resolved: false,
      acknowledged: false,
    };

    for (const fn of alertSubscribers.values()) {
      try {
        fn(alert);
      } catch (err) {
        // Silent catch
      }
    }
  }, 10000);
}

/**
 * Stop alert simulation timer.
 */
function stopAlertSimulation() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}

/**
 * Manually push an operational alert to all subscribers.
 *
 * @param {object} alert - Ops alert object
 */
export function pushAlert(alert) {
  const fullAlert = {
    id: `alert_manual_${Date.now()}`,
    timestamp: Date.now(),
    resolved: false,
    acknowledged: false,
    ...alert,
  };

  for (const fn of alertSubscribers.values()) {
    try {
      fn(fullAlert);
    } catch (err) {
      // Silent catch
    }
  }
}

/**
 * Get current crowd density snapshot.
 *
 * @returns {Record<string, { zoneName: string, density: number, trend: string, count: number, capacity: number }>} Crowd data snapshot
 */
export function getCrowdSnapshot() {
  return { ...currentCrowdData };
}

/**
 * Simulate network sync for offline state synchronization.
 *
 * @param {string} deviceId - Client device ID
 * @returns {Promise<{ synced: boolean, timestamp: number }>} Sync result
 */
export async function syncState(deviceId) {
  await new Promise(r => setTimeout(r, 200));
  return { synced: true, timestamp: Date.now() };
}

/**
 * Stop all background simulation timers.
 */
export function cleanup() {
  stopCrowdSimulation();
  stopAlertSimulation();
  crowdSubscribers.clear();
  alertSubscribers.clear();
}
