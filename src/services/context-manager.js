/**
 * @module context-manager
 * @description Adaptive conversation-context manager for PitchSync AI.
 *
 * Prevents conversation-history overflow by applying a 3-tier sliding
 * window compression strategy:
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TIER 1: Full Fidelity   │ Last 20 messages — complete text     │
 * │ TIER 2: Summarized      │ Messages 21–50  — intent + excerpt   │
 * │ TIER 3: Evicted → Digest│ 50+  — single system summary         │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * **Priority Pinning**: Messages with `accessibility`, `ticket`, or
 * `emergency` intents are *never* evicted regardless of window position.
 * This ensures the AI retains critical user context (e.g. wheelchair
 * preferences, ticket data) across arbitrarily long conversations.
 *
 * **Follow-up Detection**: The `detectFollowUp()` function analyses
 * sequential intent patterns to identify contextual transitions
 * (e.g. wayfinding → food suggests "food along the route").
 *
 * The `assembleContext()` function builds the optimal context object
 * for each GenAI call, extracting recent intent patterns for
 * follow-up detection and surfacing any existing digest.
 */

/** Maximum messages kept at full fidelity (most recent). */
const FULL_FIDELITY_LIMIT = 20;

/** Number of messages in the summary tier (beyond full fidelity). */
const SUMMARY_TIER_SIZE = 30;



/**
 * Intent types that are considered high-priority and must never be
 * evicted during context compression. These messages carry critical
 * user context (accessibility needs, ticket data, emergency state)
 * that the AI must retain across the entire conversation.
 * @type {ReadonlyArray<string>}
 */
const PRIORITY_TYPES = Object.freeze(['accessibility', 'ticket', 'emergency']);

/**
 * Known follow-up intent patterns and their contextual hints.
 *
 * Each entry maps a two-intent sequence to a hint string that the
 * GenAI engine uses to generate enriched, context-aware responses.
 * For example, if a user asks about wayfinding and then food, the
 * hint 'wayfinding→food' triggers a "food along the route" suggestion.
 * @type {ReadonlyArray<{ pattern: string[], hint: string }>}
 */
const FOLLOW_UP_PATTERNS = Object.freeze([
  { pattern: ['wayfinding', 'food'], hint: 'wayfinding→food' },
  { pattern: ['wayfinding', 'crowd'], hint: 'wayfinding→crowd' },
  { pattern: ['food', 'wayfinding'], hint: 'food→wayfinding' },
  { pattern: ['transit', 'wayfinding'], hint: 'transit→wayfinding' },
  { pattern: ['ticket', 'wayfinding'], hint: 'ticket→wayfinding' },
  { pattern: ['medical', 'wayfinding'], hint: 'medical→wayfinding' },
]);

/**
 * Estimate the token count of a message (rough heuristic).
 *
 * Uses ~4 characters per token for Latin scripts and ~2 characters
 * per token for CJK scripts, matching typical tokenizer behaviour.
 *
 * @param {string} text - Message text to estimate
 * @returns {number} Estimated token count
 *
 * @example
 * estimateTokens('Hello World')     // => 3
 * estimateTokens('こんにちは')        // => 3 (CJK: 2 chars/token)
 */
export function estimateTokens(text) {
  if (!text) return 0;
  // ~4 chars per token for English, ~2 for CJK
  const hasCJK = /[\u3000-\u9fff\uac00-\ud7af]/.test(text);
  return Math.ceil(text.length / (hasCJK ? 2 : 4));
}

/**
 * Summarize a message to its key intent and entities.
 *
 * Reduces a full message to a lightweight summary containing only
 * the role, intent, entities, timestamp, and a 100-character excerpt.
 * This is used for Tier 2 (summarized) messages.
 *
 * @param {object} message - { role, text, intent, entities, timestamp }
 * @returns {object} Compressed message with `summary: true` flag
 */
function summarizeMessage(message) {
  return {
    role: message.role,
    summary: true,
    intent: message.intent || 'general',
    entities: message.entities || {},
    timestamp: message.timestamp,
    // Keep first 100 chars as excerpt for context clues
    excerpt: (message.text || '').slice(0, 100),
  };
}

/**
 * Check if a message is high-priority (should never be evicted).
 *
 * A message is priority if its intent is in PRIORITY_TYPES, it has
 * been explicitly pinned, or it contains accessibility/ticket entities.
 *
 * @param {object} message - Chat message to check
 * @returns {boolean} True if the message must be preserved
 */
function isPriority(message) {
  if (!message) return false;
  return PRIORITY_TYPES.includes(message.intent) ||
         message.pinned === true ||
         (message.entities && (message.entities.accessibility || message.entities.ticket));
}

/**
 * Compress the context window based on the 3-tier strategy.
 *
 * Mutates the `chatHistory` array in-place, applying:
 * - Priority pinning: accessibility/ticket/emergency messages are never evicted
 * - Tier 1 (Full Fidelity): Last 20 normal messages kept verbatim
 * - Tier 2 (Summarized): Messages 21–50 compressed to intent + excerpt
 * - Tier 3 (Evicted → Digest): Messages beyond 50 collapsed into a
 *   single system digest with intent frequency counts
 *
 * @param {Array} chatHistory - Mutable chat history array
 * @returns {Array} The compressed history (same reference)
 */
export function compressContext(chatHistory) {
  if (!Array.isArray(chatHistory) || chatHistory.length <= FULL_FIDELITY_LIMIT) {
    return chatHistory;
  }

  const priorityMessages = [];
  const normalMessages = [];

  // Separate priority and normal messages
  for (const msg of chatHistory) {
    if (isPriority(msg)) {
      priorityMessages.push(msg);
    } else {
      normalMessages.push(msg);
    }
  }

  // Keep last FULL_FIDELITY_LIMIT normal messages in full fidelity (Tier 1)
  const fullFidelity = normalMessages.slice(-FULL_FIDELITY_LIMIT);

  // Summarize messages in the summary window (Tier 2)
  const toSummarize = normalMessages.slice(
    Math.max(0, normalMessages.length - FULL_FIDELITY_LIMIT - SUMMARY_TIER_SIZE),
    Math.max(0, normalMessages.length - FULL_FIDELITY_LIMIT)
  );
  const summaries = toSummarize.map(summarizeMessage);

  // Evict messages beyond the summary window → create a single digest (Tier 3)
  const evicted = normalMessages.slice(0, Math.max(0, normalMessages.length - FULL_FIDELITY_LIMIT - SUMMARY_TIER_SIZE));
  let digest = null;
  if (evicted.length > 0) {
    const intentCounts = {};
    for (const msg of evicted) {
      const intent = msg.intent || 'general';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    }
    digest = {
      role: 'system',
      type: 'digest',
      messageCount: evicted.length,
      intentSummary: intentCounts,
      timeRange: {
        from: evicted[0]?.timestamp,
        to: evicted[evicted.length - 1]?.timestamp,
      },
    };
  }

  // Rebuild history array in-place
  chatHistory.length = 0;

  // Add digest first (if exists)
  if (digest) chatHistory.push(digest);

  // Add priority messages (always retained, never evicted)
  chatHistory.push(...priorityMessages);

  // Add summaries (Tier 2)
  chatHistory.push(...summaries);

  // Add full fidelity messages (Tier 1)
  chatHistory.push(...fullFidelity);

  return chatHistory;
}

/**
 * Detect follow-up intent patterns in recent conversation history.
 *
 * Scans the last few user intents for known sequential patterns
 * (e.g. wayfinding followed by food) and returns a contextual hint
 * that the response generator uses to enrich its output.
 *
 * @param {Array<string>} recentIntents - Last 5 user intent strings
 * @returns {string|null} Contextual hint or null if no pattern matches
 *
 * @example
 * detectFollowUp(['greeting', 'wayfinding', 'food']);
 * // => 'wayfinding→food' (suggests food along the route)
 */
export function detectFollowUp(recentIntents) {
  if (!recentIntents || recentIntents.length < 2) return null;

  // Check the last two intents against known patterns
  const last = recentIntents[recentIntents.length - 1];
  const prev = recentIntents[recentIntents.length - 2];

  for (const { pattern, hint } of FOLLOW_UP_PATTERNS) {
    if (pattern[0] === prev && pattern[1] === last) {
      return hint;
    }
  }

  return null;
}

/**
 * Assemble the optimal context for a GenAI call.
 *
 * Extracts accessibility preferences, ticket status, recent intents,
 * any existing digest, and follow-up detection hints into a single
 * context object consumed by the response generator.
 *
 * @param {Array} chatHistory - Current chat history
 * @param {object} userProfile - { accessibility, ticket, savedRoutes }
 * @returns {object} Assembled context with all relevant state
 */
export function assembleContext(chatHistory, userProfile) {
  const context = {
    accessibility: userProfile?.accessibility || {},
    hasTicket: !!userProfile?.ticket,
    ticket: userProfile?.ticket || null,
    recentIntents: [],
    digest: null,
    followUpHint: null,
  };

  // Extract recent intents for pattern detection
  const recentMessages = (chatHistory || []).filter(m => !m.summary && m.role === 'user');
  context.recentIntents = recentMessages.slice(-5).map(m => m.intent).filter(Boolean);

  // Detect follow-up patterns in recent intents
  context.followUpHint = detectFollowUp(context.recentIntents);

  // Find digest if present
  const digestMsg = (chatHistory || []).find(m => m.type === 'digest');
  if (digestMsg) {
    context.digest = digestMsg;
  }

  return context;
}

/**
 * Get context statistics for monitoring and debugging.
 *
 * @param {Array} chatHistory - Current chat history
 * @returns {{ total: number, full: number, summarized: number, digests: number, priority: number, totalTokens: number }}
 */
export function getContextStats(chatHistory) {
  const history = chatHistory || [];
  const full = history.filter(m => !m.summary && m.type !== 'digest').length;
  const summarized = history.filter(m => m.summary).length;
  const digests = history.filter(m => m.type === 'digest').length;
  const priority = history.filter(isPriority).length;
  const totalTokens = history.reduce((sum, m) => sum + estimateTokens(m.text || m.excerpt || ''), 0);

  return { total: history.length, full, summarized, digests, priority, totalTokens };
}
