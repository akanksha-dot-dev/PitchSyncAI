import { test } from 'node:test';
import assert from 'node:assert';
import {
  generateCrowdData,
  generateTransitSchedules,
  STADIUM_ZONES,
  LANGUAGES,
  VENUES,
  MOCK_TICKET,
  MOCK_ROUTES,
  DENSITY_CRITICAL_THRESHOLD,
  DENSITY_WARNING_THRESHOLD,
  DENSITY_MODERATE_THRESHOLD,
  MAX_CHAT_HISTORY,
  TRANSIT_MODES,
  RESOURCE_TYPES,
  OPS_ALERT_TEMPLATES,
  ACCESSIBILITY_OPTIONS,
} from '../utils/constants.js';

// ---- Threshold Constants ----

test('density thresholds are ordered correctly', () => {
  assert.ok(DENSITY_MODERATE_THRESHOLD < DENSITY_WARNING_THRESHOLD);
  assert.ok(DENSITY_WARNING_THRESHOLD < DENSITY_CRITICAL_THRESHOLD);
  assert.strictEqual(DENSITY_CRITICAL_THRESHOLD, 85);
  assert.strictEqual(MAX_CHAT_HISTORY, 50);
});

// ---- Crowd Data Generator ----

test('generateCrowdData returns valid zone data', () => {
  const data = generateCrowdData();
  assert.ok(typeof data === 'object');
  assert.ok(Object.keys(data).length > 0);

  // Should not include the playing field
  assert.strictEqual(data.field, undefined);

  // Each zone should have required fields
  for (const [zoneId, zone] of Object.entries(data)) {
    assert.ok(typeof zone.density === 'number', `${zoneId} should have density`);
    assert.ok(zone.density >= 0 && zone.density <= 100, `${zoneId} density should be 0-100`);
    assert.ok(typeof zone.count === 'number', `${zoneId} should have count`);
    assert.ok(zone.timestamp, `${zoneId} should have timestamp`);
    assert.ok(Array.isArray(zone.alerts), `${zoneId} should have alerts array`);
  }
});

// ---- Transit Schedule Generator ----

test('generateTransitSchedules returns sorted schedules', () => {
  const schedules = generateTransitSchedules();
  assert.ok(Array.isArray(schedules));
  assert.ok(schedules.length > 0);

  // Should be sorted by departure time
  for (let i = 1; i < schedules.length; i++) {
    const prev = new Date(schedules[i - 1].departure);
    const curr = new Date(schedules[i].departure);
    assert.ok(prev <= curr, 'Schedules should be sorted by departure time');
  }

  // Each schedule should have required fields
  for (const s of schedules) {
    assert.ok(s.id, 'Should have id');
    assert.ok(s.mode, 'Should have mode');
    assert.ok(s.line, 'Should have line');
    assert.ok(s.departure, 'Should have departure');
  }
});

// ---- Static Data Integrity ----

test('LANGUAGES contains at least 10 supported languages', () => {
  assert.ok(Object.keys(LANGUAGES).length >= 10);
  assert.ok(LANGUAGES.en, 'Must support English');
  assert.ok(LANGUAGES.es, 'Must support Spanish');
  assert.ok(LANGUAGES.ar, 'Must support Arabic');
  assert.strictEqual(LANGUAGES.ar.dir, 'rtl', 'Arabic should be RTL');
});

test('VENUES contains FIFA 2026 host cities', () => {
  assert.ok(VENUES.length >= 15, 'Should have at least 15 venues');
  const names = VENUES.map(v => v.name);
  assert.ok(names.includes('MetLife Stadium'), 'Should include MetLife Stadium');
});

test('MOCK_TICKET has all required fields', () => {
  assert.ok(MOCK_TICKET.matchId);
  assert.ok(MOCK_TICKET.match);
  assert.ok(MOCK_TICKET.venue);
  assert.ok(MOCK_TICKET.gate);
  assert.ok(MOCK_TICKET.section);
  assert.ok(MOCK_TICKET.row);
  assert.ok(MOCK_TICKET.seat);
  assert.ok(MOCK_TICKET.barcode);
});

test('MOCK_ROUTES has both standard and accessible routes', () => {
  assert.ok(Array.isArray(MOCK_ROUTES.seat));
  assert.ok(Array.isArray(MOCK_ROUTES.accessible_seat));
  assert.ok(MOCK_ROUTES.seat.length > 0);
  assert.ok(MOCK_ROUTES.accessible_seat.length > 0);
});

test('STADIUM_ZONES includes all required zone types', () => {
  const types = new Set(Object.values(STADIUM_ZONES).map(z => z.type));
  assert.ok(types.has('gate'), 'Should have gates');
  assert.ok(types.has('section'), 'Should have sections');
  assert.ok(types.has('food'), 'Should have food courts');
  assert.ok(types.has('medical'), 'Should have medical stations');
  assert.ok(types.has('field'), 'Should have playing field');
});

test('TRANSIT_MODES covers all transport types', () => {
  assert.ok(TRANSIT_MODES.metro);
  assert.ok(TRANSIT_MODES.bus);
  assert.ok(TRANSIT_MODES.shuttle);
  assert.ok(TRANSIT_MODES.rideshare);
});

test('OPS_ALERT_TEMPLATES has valid severity levels', () => {
  const validSeverities = ['critical', 'warning', 'info'];
  for (const alert of OPS_ALERT_TEMPLATES) {
    assert.ok(validSeverities.includes(alert.severity), `Invalid severity: ${alert.severity}`);
    assert.ok(alert.zone, 'Alert should have a zone');
    assert.ok(alert.message, 'Alert should have a message');
  }
});

test('ACCESSIBILITY_OPTIONS covers key disability types', () => {
  const ids = ACCESSIBILITY_OPTIONS.map(o => o.id);
  assert.ok(ids.includes('wheelchair'));
  assert.ok(ids.includes('visualImpairment'));
  assert.ok(ids.includes('hearingImpairment'));
  assert.ok(ids.includes('lowSensory'));
});
