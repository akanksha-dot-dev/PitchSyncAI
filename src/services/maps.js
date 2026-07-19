/**
 * @module maps
 * @description Mocked Google Maps Platform / Routes API for PitchSync AI.
 *
 * Provides stadium wayfinding with automatic accessible-route
 * adaptation. When wheelchair or visual-impairment preferences are
 * detected, escalators become elevators, stairs become ramps, and
 * narrow passages become widened corridors. Low-sensory routes add
 * a quiet-corridor detour.
 *
 * In production, swap `getRoute()` internals with the real
 * Google Maps Routes API client.
 */

import { STADIUM_ZONES, MOCK_ROUTES } from '../utils/constants.js';

// ---- Accessible route modifiers ----
const ACCESSIBLE_ALTERNATIVES = Object.freeze({
  escalator: 'elevator',
  stairs: 'ramp',
  'narrow passage': 'widened corridor',
});

/**
 * Get a wayfinding route between two stadium locations with accessibility adaptation.
 *
 * @param {string} from - Origin Zone ID or 'entrance'
 * @param {string} to - Destination Zone ID or 'seat'
 * @param {object} [accessibilityPrefs={}] - User accessibility flags { wheelchair, visualImpairment, lowSensory }
 * @returns {Promise<{ steps: Array<{ step: number, instruction: string, distance: string, time: string, accessible?: boolean }>, totalTime: string, totalDistance: string, accessible: boolean }>} Route calculation payload
 *
 * @example
 * const route = await getRoute('gate_a', 'section_100', { wheelchair: true });
 * console.log(route.accessible); // => true
 */
export async function getRoute(from, to, accessibilityPrefs = {}) {
  // Simulate API latency
  await new Promise(r => setTimeout(r, 150 + Math.random() * 250));

  const isAccessible = Boolean(accessibilityPrefs.wheelchair || accessibilityPrefs.visualImpairment);

  // Use pre-built routes
  const baseRoute = isAccessible ? MOCK_ROUTES.accessible_seat : MOCK_ROUTES.seat;

  // Modify routes for accessibility
  const steps = baseRoute.map(step => {
    if (isAccessible) {
      let instruction = step.instruction;
      for (const [original, replacement] of Object.entries(ACCESSIBLE_ALTERNATIVES)) {
        instruction = instruction.replace(new RegExp(original, 'gi'), replacement);
      }
      return { ...step, instruction, accessible: true };
    }
    return { ...step };
  });

  // Add low-sensory alternatives if requested
  if (accessibilityPrefs.lowSensory) {
    steps.splice(1, 0, {
      step: 0,
      instruction: '🤫 Taking quiet corridor route (less crowded, reduced noise)',
      distance: '+30m',
      time: '+1 min',
      icon: '🤫',
    });
    // Re-number steps
    steps.forEach((s, i) => { s.step = i + 1; });
  }

  const totalTime = steps.reduce((sum, s) => {
    const match = s.time.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  return {
    steps,
    totalTime: `${totalTime} min`,
    totalDistance: isAccessible ? '160m' : '200m',
    accessible: isAccessible,
  };
}

/**
 * Find nearby points of interest in the stadium based on proximity coordinates.
 *
 * @param {string} category - Point category ('food'|'medical'|'restroom'|'gate'|'vip')
 * @param {string} [nearZone] - Current zone ID for proximity calculation
 * @returns {Promise<Array<{ name: string, distance: string, zone: string, icon: string }>>} List of matching nearby points
 *
 * @example
 * const food = await findNearby('food', 'gate_a');
 */
export async function findNearby(category, nearZone) {
  await new Promise(r => setTimeout(r, 100 + Math.random() * 150));

  const matches = Object.values(STADIUM_ZONES)
    .filter(z => z.type === category)
    .map(z => {
      let distance = '~5 min walk';
      if (nearZone && STADIUM_ZONES[nearZone]) {
        const from = STADIUM_ZONES[nearZone];
        const dx = z.x - from.x;
        const dy = z.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minutes = Math.max(1, Math.round(dist / 80));
        distance = `~${minutes} min walk`;
      }

      return {
        name: z.name,
        distance,
        zone: z.id,
        icon: getZoneIcon(z.type),
      };
    })
    .sort((a, b) => parseInt(a.distance, 10) - parseInt(b.distance, 10));

  return matches;
}

/**
 * Get display icon string for a zone category type.
 *
 * @param {string} type - Zone type identifier
 * @returns {string} Emoji icon string
 */
function getZoneIcon(type) {
  const icons = {
    gate: '🚪', section: '🏟️', concourse: '🚶', food: '🍔',
    medical: '🏥', vip: '⭐', restroom: '🚻', field: '⚽',
  };
  return icons[type] || '📍';
}

/**
 * Get copy of all stadium zone configurations.
 *
 * @returns {Record<string, { id: string, name: string, type: string, x: number, y: number, capacity: number }>} Copy of zones object
 */
export function getStadiumZones() {
  return { ...STADIUM_ZONES };
}
