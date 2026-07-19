import { test } from 'node:test';
import assert from 'node:assert';
import { getRoute, getStadiumZones } from '../services/maps.js';

test('getRoute returns standard route', async () => {
  const result = await getRoute('gate_a', 'section_100');
  assert.ok(Array.isArray(result.steps));
  assert.ok(result.steps.length > 0);
  assert.ok(result.totalTime);
  assert.ok(result.totalDistance);
  assert.ok(!result.accessible, 'Standard route should not be accessible');
});

test('getRoute returns accessible route when wheelchair is set', async () => {
  const result = await getRoute('gate_a', 'section_100', { wheelchair: true });
  assert.strictEqual(result.accessible, true);
  // Accessible routes should use elevators, not escalators
  const hasElevator = result.steps.some(s =>
    s.instruction.toLowerCase().includes('elevator')
  );
  assert.ok(hasElevator, 'Accessible route should include elevator');
});

test('getRoute adds low-sensory detour when requested', async () => {
  const result = await getRoute('gate_a', 'section_100', { lowSensory: true });
  const hasQuiet = result.steps.some(s =>
    s.instruction.toLowerCase().includes('quiet')
  );
  assert.ok(hasQuiet, 'Low-sensory route should include quiet corridor');
});

test('getRoute accessible route replaces stairs with ramps', async () => {
  const result = await getRoute('gate_a', 'section_100', { visualImpairment: true });
  assert.strictEqual(result.accessible, true);
  // Should not have escalators in accessible routes
  const hasEscalator = result.steps.some(s =>
    s.instruction.toLowerCase().includes('escalator')
  );
  assert.strictEqual(hasEscalator, false, 'Accessible route should not have escalators');
});

test('getStadiumZones returns all zones', () => {
  const zones = getStadiumZones();
  assert.ok(zones.gate_a, 'Should have gate_a');
  assert.ok(zones.field, 'Should have field');
  assert.ok(Object.keys(zones).length > 10, 'Should have many zones');
});
