/* ============================================================
   FIFA MatchDay GenAI Nexus — Adaptive Context Manager
   3-tier sliding window compression for conversation history
   ============================================================ */

const FULL_WINDOW = 20;      // Keep last 20 messages in full
const SUMMARY_WINDOW = 30;   // Messages 21-50 compressed to summaries
const MAX_HISTORY = 50;      // Maximum messages retained

// Priority message types that should never be evicted
const PRIORITY_TYPES = ['accessibility', 'ticket', 'emergency'];

/**
 * Estimate the token count of a message (rough heuristic)
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text) return 0;
  // ~4 chars per token for English, ~2 for CJK
  const hasCJK = /[\u3000-\u9fff\uac00-\ud7af]/.test(text);
  return Math.ceil(text.length / (hasCJK ? 2 : 4));
}

/**
 * Summarize a message to its key intent + entities
 * @param {object} message - { role, text, intent, entities, timestamp }
 * @returns {object} Compressed message
 */
function summarizeMessage(message) {
  return {
    role: message.role,
    summary: true,
    intent: message.intent || 'general',
    entities: message.entities || {},
    timestamp: message.timestamp,
    // Keep first 100 chars as excerpt
    excerpt: (message.text || '').slice(0, 100),
  };
}

/**
 * Check if a message is a priority message (should not be evicted)
 * @param {object} message
 * @returns {boolean}
 */
function isPriority(message) {
  if (!message) return false;
  return PRIORITY_TYPES.includes(message.intent) ||
         message.pinned === true ||
         (message.entities && (message.entities.accessibility || message.entities.ticket));
}

/**
 * Compress the context window based on the 3-tier strategy
 * Mutates the chatHistory array in-place
 * @param {Array} chatHistory
 * @returns {Array} The compressed history
 */
export function compressContext(chatHistory) {
  if (!Array.isArray(chatHistory) || chatHistory.length <= FULL_WINDOW) {
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

  // Keep last FULL_WINDOW normal messages in full fidelity
  const fullFidelity = normalMessages.slice(-FULL_WINDOW);

  // Summarize messages in the summary window
  const toSummarize = normalMessages.slice(
    Math.max(0, normalMessages.length - FULL_WINDOW - SUMMARY_WINDOW),
    Math.max(0, normalMessages.length - FULL_WINDOW)
  );
  const summaries = toSummarize.map(summarizeMessage);

  // Evict messages beyond the summary window → create a single digest
  const evicted = normalMessages.slice(0, Math.max(0, normalMessages.length - FULL_WINDOW - SUMMARY_WINDOW));
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

  // Rebuild history
  chatHistory.length = 0;

  // Add digest first (if exists)
  if (digest) chatHistory.push(digest);

  // Add priority messages (always retained)
  chatHistory.push(...priorityMessages);

  // Add summaries
  chatHistory.push(...summaries);

  // Add full fidelity messages
  chatHistory.push(...fullFidelity);

  return chatHistory;
}

/**
 * Assemble the optimal context for a GenAI call
 * @param {Array} chatHistory
 * @param {object} userProfile - { accessibility, ticket, savedRoutes }
 * @returns {object} Assembled context
 */
export function assembleContext(chatHistory, userProfile) {
  const context = {
    accessibility: userProfile?.accessibility || {},
    hasTicket: !!userProfile?.ticket,
    ticket: userProfile?.ticket || null,
    recentIntents: [],
    digest: null,
  };

  // Extract recent intents for pattern detection
  const recentMessages = (chatHistory || []).filter(m => !m.summary && m.role === 'user');
  context.recentIntents = recentMessages.slice(-5).map(m => m.intent).filter(Boolean);

  // Find digest if present
  const digestMsg = (chatHistory || []).find(m => m.type === 'digest');
  if (digestMsg) {
    context.digest = digestMsg;
  }

  return context;
}

/**
 * Get context stats for monitoring
 * @param {Array} chatHistory
 * @returns {object}
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

export default { compressContext, assembleContext, getContextStats, estimateTokens };
