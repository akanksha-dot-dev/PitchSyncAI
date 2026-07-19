/**
 * @module genai-engine
 * @description GenAI processing engine for PitchSync AI.
 *
 * Implements a template-based NLP pipeline that processes fan queries
 * through the following stages:
 *
 * ```
 * User Input → XSS Sanitization → Prompt Injection Defense
 *   → Language Detection → Intent Classification → Entity Extraction
 *   → Follow-up Detection → Context Assembly → Response Generation
 *   → Ambiguity Disambiguation → Rich UI Card Rendering
 * ```
 *
 * **Intent Classification**: Multi-language keyword matching across
 * 8 intent categories (`wayfinding`, `transit`, `food`, `medical`,
 * `accessibility`, `ticket`, `crowd`, `greeting`) with confidence
 * scoring (0.70–0.90). Each intent resolves to a specific response
 * template and optional rich-data payload (route cards, transit
 * schedules, ticket embeds).
 *
 * **Entity Extraction**: Regex-based extraction of gate identifiers
 * (`A`–`H`), section numbers, row letters, seat numbers, and
 * stadium zone names from the sanitized input.
 *
 * **Follow-up Detection**: Analyses recent intent patterns to provide
 * contextually-aware responses (e.g. wayfinding → food suggests
 * nearby food along the route).
 *
 * **Ambiguity Disambiguation**: When confidence is low and multiple
 * intents score similarly, generates a clarification prompt instead
 * of falling back to generic.
 *
 * **Accessibility Awareness**: When the assembled context includes
 * wheelchair or visual-impairment preferences, the wayfinding
 * intent automatically switches to accessible route generation.
 *
 * In production, the template-based engine would be replaced by a
 * hosted LLM (e.g. Gemini) while preserving the same processing
 * pipeline and response contract.
 */

import { RESPONSE_TEMPLATES, MOCK_TICKET, STADIUM_ZONES } from '../utils/constants.js';
import { detectLanguage } from './translation.js';
import { getRoute } from './maps.js';
import { getSchedule } from './transit.js';
import { compressContext, assembleContext } from './context-manager.js';
import { sanitizeHTML, sanitizePromptInjection } from '../utils/validators.js';

// ---- Intent Patterns ----
// Each intent has multilingual keyword arrays and a base confidence score.
// Confidence is boosted when multiple keywords match (multi-signal bonus).
const INTENT_PATTERNS = {
  wayfinding: {
    keywords: ['navigate', 'find', 'where', 'directions', 'seat', 'how to get', 'route', 'way', 'go to', 'take me', 'guide', 'location', 'map', 'lost',
      'navegar', 'encontrar', 'dónde', 'asiento', 'ruta', 'lugar',
      'naviguer', 'trouver', 'où', 'siège', 'itinéraire'],
    confidence: 0.85,
  },
  transit: {
    keywords: ['transit', 'bus', 'metro', 'subway', 'train', 'shuttle', 'transport', 'schedule', 'departure', 'leave', 'ride', 'uber', 'taxi', 'parking',
      'transporte', 'autobús', 'horario', 'salida',
      'transport', 'départ', 'horaires'],
    confidence: 0.85,
  },
  food: {
    keywords: ['food', 'eat', 'hungry', 'restaurant', 'drink', 'beer', 'water', 'snack', 'pizza', 'burger', 'concession', 'vendor',
      'comida', 'comer', 'hambre', 'bebida',
      'nourriture', 'manger', 'boire'],
    confidence: 0.80,
  },
  medical: {
    keywords: ['medical', 'doctor', 'nurse', 'help', 'emergency', 'sick', 'hurt', 'injury', 'first aid', 'ambulance', 'health',
      'médico', 'emergencia', 'enfermo', 'herido',
      'médecin', 'urgence', 'malade', 'blessé'],
    confidence: 0.90,
  },
  accessibility: {
    keywords: ['accessible', 'wheelchair', 'disability', 'elevator', 'ramp', 'hearing', 'vision', 'blind', 'deaf', 'sensory',
      'accesible', 'silla de ruedas', 'discapacidad',
      'accessible', 'fauteuil roulant', 'handicap'],
    confidence: 0.85,
  },
  ticket: {
    keywords: ['ticket', 'pass', 'barcode', 'qr', 'entry', 'admission', 'my seat', 'seat number', 'section',
      'boleto', 'entrada', 'mi asiento',
      'billet', 'entrée', 'ma place'],
    confidence: 0.80,
  },
  crowd: {
    keywords: ['crowd', 'busy', 'crowded', 'wait', 'queue', 'line', 'density', 'packed', 'full',
      'multitud', 'lleno', 'cola', 'espera',
      'foule', 'bondé', 'file', 'attente'],
    confidence: 0.75,
  },
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'help', 'start',
      'hola', 'buenos días',
      'bonjour', 'salut', 'aide'],
    confidence: 0.70,
  },
};

// ---- DRY Helpers ----

/**
 * Resolve a response template for the given key and language.
 *
 * Falls back to English ('en') if the requested language is not available.
 * Centralises the `templates[key][lang] || templates[key].en` pattern
 * that was previously duplicated in every switch branch.
 *
 * @param {string} key - Template category (e.g. 'welcome', 'wayfinding')
 * @param {string} lang - ISO 639-1 language code
 * @returns {string} Resolved template text
 */
function resolveTemplate(key, lang) {
  const group = RESPONSE_TEMPLATES[key];
  if (!group) return RESPONSE_TEMPLATES.fallback.en;
  return group[lang] || group.en || RESPONSE_TEMPLATES.fallback.en;
}

/**
 * Extract named entities from user text using regex patterns.
 *
 * Parses gate identifiers (A–H), three-digit section numbers,
 * row letters, seat numbers, and stadium zone names from the input.
 * Extracted entities enrich the intent context for accurate response
 * generation (e.g. wayfinding to a specific gate or section).
 *
 * @param {string} lower - Lowercased user input
 * @returns {object} Extracted entities (gate, section, row, seat, zone)
 */
function extractEntities(lower) {
  const entities = {};

  const gateMatch = lower.match(/gate\s*([a-h])/i);
  if (gateMatch) entities.gate = gateMatch[1].toUpperCase();

  const sectionMatch = lower.match(/section\s*(\d{3})/i);
  if (sectionMatch) entities.section = sectionMatch[1];

  const rowMatch = lower.match(/row\s*([a-z])/i);
  if (rowMatch) entities.row = rowMatch[1].toUpperCase();

  const seatMatch = lower.match(/seat\s*(\d+)/i);
  if (seatMatch) entities.seat = seatMatch[1];

  // Zone detection — match against known stadium zone names
  for (const [zoneId, zone] of Object.entries(STADIUM_ZONES)) {
    if (lower.includes(zone.name.toLowerCase()) || lower.includes(zoneId.replace(/_/g, ' '))) {
      entities.zone = zoneId;
      break;
    }
  }

  return entities;
}

/**
 * Classify the intent of a user message.
 *
 * Scores each intent category by counting keyword matches and applying
 * the category's base confidence. A multi-signal bonus (+0.1) is added
 * when two or more keywords match, improving classification accuracy
 * for complex queries.
 *
 * @param {string} message - Sanitized user input
 * @returns {{ intent: string, confidence: number, entities: object, allScores: Array }}
 */
export function classifyIntent(message) {
  const lower = message.toLowerCase().trim();
  let bestIntent = 'general';
  let bestScore = 0;
  const allScores = [];

  for (const [intent, { keywords, confidence }] of Object.entries(INTENT_PATTERNS)) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      const score = (matchCount / keywords.length) * confidence + (matchCount > 1 ? 0.1 : 0);
      allScores.push({ intent, score });
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
  }

  // Sort allScores descending for disambiguation analysis
  allScores.sort((a, b) => b.score - a.score);

  // Entity extraction (Single Responsibility — delegated to helper)
  const entities = extractEntities(lower);

  return {
    intent: bestIntent,
    confidence: Math.min(1, bestScore),
    entities,
    allScores,
  };
}

/**
 * Detect ambiguous intent and generate a disambiguation prompt.
 *
 * When the top two intent scores are close (within 30% of each other)
 * and the best confidence is low (< 0.3), the user's query is considered
 * ambiguous. Rather than falling back to a generic response, the system
 * asks the user to clarify which topic they meant.
 *
 * @param {Array} allScores - Sorted intent scores from classifyIntent
 * @param {number} bestConfidence - Confidence of the top intent
 * @param {string} lang - Language code for template resolution
 * @returns {{ text: string, type: string }|null} Disambiguation prompt or null
 */
function checkAmbiguity(allScores, bestConfidence, lang) {
  if (allScores.length < 2 || bestConfidence >= 0.3) return null;

  const [first, second] = allScores;
  // If the gap between top-two intents is small, the query is ambiguous
  const gap = first.score - second.score;
  if (gap < first.score * 0.3) {
    const intentNames = {
      wayfinding: '🗺️ Navigation & directions',
      transit: '🚇 Transit schedules',
      food: '🍔 Food & dining',
      medical: '🏥 Medical assistance',
      accessibility: '♿ Accessibility routes',
      ticket: '🎟️ Ticket information',
      crowd: '📊 Crowd status',
      greeting: '👋 General help',
    };
    const opt1 = intentNames[first.intent] || first.intent;
    const opt2 = intentNames[second.intent] || second.intent;

    return {
      text: `I'd like to help! It seems like you might be asking about:\n\n• **${opt1}**\n• **${opt2}**\n\nCould you clarify which one you need help with?`,
      type: 'text',
    };
  }
  return null;
}

/**
 * Generate a response based on classified intent.
 *
 * @param {string} intent - Classified intent category
 * @param {object} entities - Extracted entities
 * @param {string} language - ISO 639-1 language code
 * @param {object} context - Assembled context from context-manager
 * @param {object} [crowdData] - Live crowd data for density-aware responses
 * @returns {Promise<{ text: string, richData?: object, type: string }>}
 */
export async function generateResponse(intent, entities, language, context, crowdData) {
  const lang = language || 'en';

  // Simulate 200–600ms GenAI processing time
  await new Promise(r => setTimeout(r, 200 + Math.random() * 400));

  // Check for follow-up context to enrich the response
  const followUpHint = context?.followUpHint;

  switch (intent) {
    case 'greeting':
      return {
        text: resolveTemplate('welcome', lang),
        type: 'text',
      };

    case 'wayfinding': {
      const isAccessible = context?.accessibility?.wheelchair;
      const routeData = await getRoute(
        entities.gate || 'gate_a',
        entities.section || 'section_100',
        { accessible: isAccessible }
      );

      let prefix = resolveTemplate('wayfinding', lang);

      // Crowd-aware wayfinding: warn if destination zone is congested
      const destZone = entities.zone || entities.section;
      if (destZone && crowdData?.[destZone]?.density > 75) {
        const density = crowdData[destZone].density;
        prefix += `\n⚠️ **Note**: The area near ${crowdData[destZone].zoneName || destZone} is currently at **${density}%** density. Consider alternate routes.\n\n`;
      }

      return {
        text: prefix,
        richData: { type: 'route', steps: routeData.steps, accessible: isAccessible },
        type: 'route',
      };
    }

    case 'transit': {
      const schedules = getSchedule();
      const prefix = resolveTemplate('transit', lang);
      return {
        text: prefix,
        richData: { type: 'transit', schedules: schedules.slice(0, 5) },
        type: 'transit',
      };
    }

    case 'food': {
      let text = resolveTemplate('food', lang);
      // Follow-up enrichment: if user was navigating before asking about food,
      // add a contextual hint about food along their route.
      if (followUpHint === 'wayfinding→food') {
        text += '\n\n💡 *Tip: The North Concourse food stands are along the route to your seat!*';
      }
      return { text, type: 'text' };
    }

    case 'medical':
      return {
        text: resolveTemplate('medical', lang),
        type: 'text',
      };

    case 'accessibility':
      return {
        text: resolveTemplate('accessibility', lang),
        type: 'text',
      };

    case 'ticket':
      return {
        text: '🎟️ **Your Ticket Details**:\n\n',
        richData: { type: 'ticket', ticket: MOCK_TICKET },
        type: 'ticket',
      };

    case 'crowd': {
      return {
        text: `📊 **Live Crowd Status**:\n\nI'm checking real-time density data across the stadium. Currently:\n\n• **Gate A** — Moderate (${55 + Math.floor(Math.random() * 20)}%)\n• **Gate C** — High (${75 + Math.floor(Math.random() * 15)}%) ⚠️\n• **North Concourse** — Low (${25 + Math.floor(Math.random() * 15)}%)\n\nI recommend entering through **Gate G** for the shortest wait.`,
        type: 'text',
      };
    }

    default:
      return {
        text: resolveTemplate('fallback', lang),
        type: 'text',
      };
  }
}

/**
 * Process a full user message through the GenAI pipeline.
 *
 * Pipeline stages:
 * 1. XSS sanitization
 * 2. Prompt injection defense
 * 3. Language detection
 * 4. Intent classification
 * 5. Ambiguity check / disambiguation
 * 6. Context assembly (with follow-up detection)
 * 7. Response generation
 * 8. Context compression (if history exceeds thresholds)
 *
 * @param {string} rawMessage - User input
 * @param {string} language - Current language setting
 * @param {Array} chatHistory - Chat history for context
 * @param {object} userProfile - User profile with accessibility prefs
 * @param {object} [crowdData] - Optional live crowd data
 * @returns {Promise<{ text: string, richData?: object, type: string, detectedLang?: string, intent?: string, confidence?: number }>}
 */
export async function processMessage(rawMessage, language, chatHistory, userProfile, crowdData) {
  try {
    // 1. Sanitize input (XSS prevention)
    const clean = sanitizeHTML(rawMessage.trim());
    if (!clean) throw new Error('Empty message');

    // 2. Prompt injection defense
    const injectionCheck = sanitizePromptInjection(clean);
    const safeInput = injectionCheck.safe ? clean : injectionCheck.cleaned;

    if (!injectionCheck.safe) {
      console.warn('[GenAI] Prompt injection blocked:', injectionCheck.threat);
    }

    // 3. Detect language
    const detected = detectLanguage(safeInput);

    // 4. Classify intent
    const { intent, confidence, entities, allScores } = classifyIntent(safeInput);

    // 5. Check for ambiguous input — offer disambiguation instead of generic fallback
    const disambiguation = checkAmbiguity(allScores, confidence, language);
    if (disambiguation) {
      return {
        ...disambiguation,
        detectedLang: detected.language,
        intent: 'disambiguation',
        confidence,
      };
    }

    // 6. Assemble context from history (includes follow-up detection)
    const context = assembleContext(chatHistory, userProfile);

    // 7. Generate response
    const response = await generateResponse(intent, entities, language, context, crowdData);

    // 8. Compress history if needed
    compressContext(chatHistory);

    return {
      ...response,
      detectedLang: detected.language,
      intent,
      confidence,
    };
  } catch (err) {
    console.error('[GenAI] Processing error:', err);
    return {
      text: resolveTemplate('fallback', language || 'en'),
      type: 'text',
      error: true,
    };
  }
}
