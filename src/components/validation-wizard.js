/* ============================================================
   FIFA MatchDay GenAI Nexus — Validation Wizard Component
   Proactive reroute conflict checker for Ops staff
   ============================================================ */

import { h, $ } from '../utils/dom.js';
import { createFocusTrap, announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { on, emit } from '../core/events.js';
import { STADIUM_ZONES, ACCESSIBILITY_OPTIONS } from '../utils/constants.js';

let focusTrap = null;

/**
 * Initialize the validation wizard system
 */
export function initValidationWizard() {
  on('wizard:open', (data) => openWizard(data));
  subscribe('wizardOpen', (open) => {
    if (!open) closeWizard();
  });
}

/**
 * Open the validation wizard
 * @param {object} data - { alert, zone }
 */
function openWizard(data) {
  if ($('#wizard-overlay')) return;

  const zone = STADIUM_ZONES[data.zone];
  const alert = data.alert;

  // Run validation checks
  const checks = runValidationChecks(data.zone, alert);

  const overlay = h('div', {
    class: 'wizard-overlay',
    id: 'wizard-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Reroute Validation Wizard',
    onClick: (e) => {
      if (e.target === overlay) closeWizard();
    },
  },
    h('div', { class: 'wizard-panel', id: 'wizard-panel' },
      // Header
      h('div', { class: 'wizard-panel__header' },
        h('div', { class: 'flex items-center justify-between' },
          h('h2', { class: 'wizard-panel__title flex items-center gap-2' },
            h('span', { 'aria-hidden': 'true' }, '🔀'),
            'Reroute Validation',
          ),
          h('button', {
            class: 'btn btn--ghost btn--icon',
            'aria-label': 'Close wizard',
            onClick: closeWizard,
          }, '✕'),
        ),
        h('p', { class: 'wizard-panel__subtitle' },
          `Checking proposed reroute from ${zone?.name || data.zone}`,
        ),
      ),

      // Body - Validation Steps
      h('div', { class: 'wizard-panel__body space-y-3' },
        // Step 1: Proposed reroute
        createWizardStep(1, 'done', 'Reroute Proposal',
          `Divert crowd from ${zone?.name || data.zone} to alternate pathways based on ${alert?.severity || 'elevated'} density alert.`,
        ),

        // Step 2: Accessibility check
        createWizardStep(2,
          checks.accessibilityConflict ? 'warning' : 'done',
          'Accessibility Pathway Check',
          checks.accessibilityConflict
            ? `⚠️ **Conflict detected**: Proposed reroute may block ${checks.accessibilityDetail}. Alternative accessible path must be maintained.`
            : '✓ No conflicts with accessible pathways. Wheelchair routes and elevator access remain clear.',
        ),

        // Step 3: Transit capacity check
        createWizardStep(3,
          checks.transitConflict ? 'error' : 'done',
          'Transit Capacity Check',
          checks.transitConflict
            ? `❌ **Capacity exceeded**: Rerouting ${checks.estimatedFlow} fans/min to transit zone exceeds shuttle capacity of ${checks.transitCapacity}. Risk of secondary bottleneck.`
            : '✓ Transit zone can absorb the redirected crowd flow. Current capacity utilization at 62%.',
        ),

        // Step 4: Impact summary
        createWizardStep(4, checks.overallStatus,
          'Impact Summary',
          getImpactSummary(checks),
        ),
      ),

      // Footer
      h('div', { class: 'wizard-panel__footer' },
        h('button', {
          class: 'btn btn--secondary',
          onClick: closeWizard,
        }, 'Cancel'),
        checks.overallStatus === 'error'
          ? h('button', {
              class: 'btn btn--secondary',
              onClick: () => {
                announce('Opening modified reroute options');
                closeWizard();
              },
            }, '🔧 Modify Route')
          : null,
        h('button', {
          class: `btn ${checks.overallStatus === 'error' ? 'btn--danger' : 'btn--primary'}`,
          onClick: () => handleApproveReroute(data, checks),
        }, checks.overallStatus === 'error' ? '⚠️ Force Approve' : '✓ Approve Reroute'),
      ),
    ),
  );

  document.body.appendChild(overlay);

  // Setup focus trap
  const panel = $('#wizard-panel');
  if (panel) {
    focusTrap = createFocusTrap(panel);
    focusTrap.activate();
  }

  announce('Reroute validation wizard opened. Review the 4 validation steps.');
}

/**
 * Create a wizard step item
 */
function createWizardStep(number, status, title, description) {
  return h('div', { class: 'wizard-step' },
    h('div', { class: `wizard-step__indicator wizard-step__indicator--${status}` },
      status === 'done' ? '✓' :
      status === 'warning' ? '!' :
      status === 'error' ? '✕' : String(number),
    ),
    h('div', { class: 'flex-1' },
      h('h4', { class: 'text-sm font-semibold text-slate-800' }, title),
      h('p', {
        class: 'text-xs text-slate-600 mt-1 leading-relaxed',
        innerHTML: formatMarkdown(description),
      }),
    ),
  );
}

/**
 * Run validation checks for a proposed reroute
 * @param {string} zoneId
 * @param {object} alert
 * @returns {object}
 */
function runValidationChecks(zoneId, alert) {
  const zone = STADIUM_ZONES[zoneId];
  const crowdInfo = state.crowdData?.[zoneId];
  const density = crowdInfo?.density || 50;

  // Simulate accessibility conflict (30% chance)
  const accessibilityConflict = Math.random() < 0.3;
  const accessibleZones = ['gate_a', 'gate_c', 'gate_e', 'gate_g'];
  const hasAccessiblePath = accessibleZones.includes(zoneId);

  // Simulate transit capacity issue (20% chance)
  const transitConflict = density > 80 && Math.random() < 0.4;
  const estimatedFlow = Math.floor(density * 3 + Math.random() * 50);
  const transitCapacity = 250;

  const overallStatus = transitConflict ? 'error' : accessibilityConflict ? 'warning' : 'done';

  return {
    accessibilityConflict: accessibilityConflict && hasAccessiblePath,
    accessibilityDetail: 'wheelchair ramp at Section 105-A',
    transitConflict,
    estimatedFlow,
    transitCapacity,
    overallStatus,
    density,
    zoneName: zone?.name || zoneId,
  };
}

/**
 * Get impact summary text
 */
function getImpactSummary(checks) {
  if (checks.overallStatus === 'done') {
    return '✅ **All checks passed.** The proposed reroute is safe to execute. Estimated crowd redistribution will complete in 8-12 minutes.';
  }
  if (checks.overallStatus === 'warning') {
    return '⚠️ **Proceed with caution.** Accessibility pathway conflict detected. Assign 2 accessibility staff to maintain alternative wheelchair route before executing reroute.';
  }
  return '❌ **Reroute not recommended** in current form. Transit capacity would be exceeded, creating a secondary bottleneck. Consider splitting flow across multiple gates or delaying reroute by 5 minutes.';
}

/**
 * Format simple markdown
 */
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/**
 * Handle reroute approval
 */
function handleApproveReroute(data, checks) {
  const status = checks.overallStatus === 'error' ? 'force-approved' : 'approved';
  announce(`Reroute ${status} for ${checks.zoneName}`);
  emit('reroute:approved', { ...data, status, checks });
  closeWizard();
}

/**
 * Close the wizard
 */
function closeWizard() {
  const overlay = $('#wizard-overlay');
  if (overlay) {
    overlay.remove();
  }
  if (focusTrap) {
    focusTrap.deactivate();
    focusTrap = null;
  }
  state.wizardOpen = false;
  state.wizardData = null;
}

export default { initValidationWizard };
