/* ============================================================
   FIFA MatchDay GenAI Nexus — Firebase/Firestore Service (Mocked)
   Real-time crowd density simulation + cross-device sync
   ============================================================ */

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
 * Subscribe to real-time crowd density updates
 * Simulates Firestore onSnapshot listener
 * @param {Function} callback - (crowdData) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCrowdData(callback) {
  const id = `crowd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  crowdSubscribers.set(id, callback);

  // Send initial data immediately
  callback(currentCrowdData);

  // Start simulation if not already running
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
 * Subscribe to real-time alert updates
 * @param {Function} callback - (alert) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAlerts(callback) {
  const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
 * Push an alert to all subscribers
 * @param {object} alert - { severity, zone, message, action }
 */
export function pushAlert(alert) {
  const enrichedAlert = {
    id: `alert_${++alertCounter}`,
    ...alert,
    timestamp: Date.now(),
    acknowledged: false,
    resolved: false,
  };

  for (const callback of alertSubscribers.values()) {
    try {
      callback(enrichedAlert);
    } catch (err) {
      console.error('[Firebase] Alert subscriber error:', err);
    }
  }
}

/**
 * Simulate cross-device state sync
 * @param {string} deviceId
 * @param {object} state
 * @returns {Promise<void>}
 */
export async function syncState(deviceId, state) {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  // In production, this would write to Firestore
  console.info(`[Firebase] State synced for device ${deviceId}`);
}

/**
 * Start crowd data simulation (updates every 5 seconds)
 */
function startCrowdSimulation() {
  crowdInterval = setInterval(() => {
    // Evolve crowd data (gradual changes, not random jumps)
    const prevData = currentCrowdData;
    const newData = {};

    for (const [zoneId, prev] of Object.entries(prevData)) {
      // Smooth transition: ±5% max change per tick
      const delta = (Math.random() - 0.5) * 10;
      const newDensity = Math.min(100, Math.max(5, prev.density + delta));
      const trend = newDensity > prev.density + 2 ? 'rising' :
                    newDensity < prev.density - 2 ? 'falling' : 'stable';

      newData[zoneId] = {
        ...prev,
        density: Math.round(newDensity),
        trend,
        count: Math.round((newDensity / 100) * prev.capacity),
        timestamp: Date.now(),
        alerts: newDensity > 85 ? ['High density warning'] : [],
      };
    }

    currentCrowdData = newData;

    // Notify all subscribers
    for (const callback of crowdSubscribers.values()) {
      try {
        callback(newData);
      } catch (err) {
        console.error('[Firebase] Crowd subscriber error:', err);
      }
    }
  }, 5000);
}

/**
 * Stop crowd simulation
 */
function stopCrowdSimulation() {
  if (crowdInterval) {
    clearInterval(crowdInterval);
    crowdInterval = null;
  }
}

/**
 * Start alert simulation (random alerts every 8-15 seconds)
 */
function startAlertSimulation() {
  function scheduleNext() {
    const delay = 8000 + Math.random() * 7000;
    alertInterval = setTimeout(() => {
      // Pick a random alert template
      const template = OPS_ALERT_TEMPLATES[Math.floor(Math.random() * OPS_ALERT_TEMPLATES.length)];

      // Add some dynamic data
      const zoneData = currentCrowdData[template.zone];
      const density = zoneData ? zoneData.density : Math.floor(50 + Math.random() * 40);

      pushAlert({
        ...template,
        message: template.message.replace(/\d+%/, `${density}%`),
      });

      scheduleNext();
    }, delay);
  }
  scheduleNext();
}

/**
 * Stop alert simulation
 */
function stopAlertSimulation() {
  if (alertInterval) {
    clearTimeout(alertInterval);
    alertInterval = null;
  }
}

/**
 * Get current crowd data snapshot (without subscribing)
 * @returns {object}
 */
export function getCrowdSnapshot() {
  return { ...currentCrowdData };
}

/**
 * Cleanup all simulations
 */
export function cleanup() {
  stopCrowdSimulation();
  stopAlertSimulation();
  crowdSubscribers.clear();
  alertSubscribers.clear();
}

export default {
  subscribeToCrowdData, subscribeToAlerts, pushAlert,
  syncState, getCrowdSnapshot, cleanup,
};
