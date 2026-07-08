/* ============================================================
   FIFA MatchDay GenAI Nexus — GenAI Processing Engine
   Intent classification + response generation
   ============================================================ */

import { RESPONSE_TEMPLATES, MOCK_ROUTES, MOCK_TICKET, STADIUM_ZONES } from '../utils/constants.js';
import { translateText, detectLanguage } from './translation.js';
import { getRoute } from './maps.js';
import { getSchedule } from './transit.js';
import { compressContext, assembleContext } from './context-manager.js';
import { sanitizeHTML } from '../utils/validators.js';

// ---- Intent Patterns ----
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

/**
 * Classify the intent of a user message
 * @param {string} message
 * @returns {{ intent: string, confidence: number, entities: object }}
 */
export function classifyIntent(message) {
  const lower = message.toLowerCase().trim();
  let bestIntent = 'general';
  let bestScore = 0;
  const entities = {};

  for (const [intent, { keywords, confidence }] of Object.entries(INTENT_PATTERNS)) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      const score = (matchCount / keywords.length) * confidence + (matchCount > 1 ? 0.1 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
  }

  // Entity extraction
  const gateMatch = lower.match(/gate\s*([a-h])/i);
  if (gateMatch) entities.gate = gateMatch[1].toUpperCase();

  const sectionMatch = lower.match(/section\s*(\d{3})/i);
  if (sectionMatch) entities.section = sectionMatch[1];

  const rowMatch = lower.match(/row\s*([a-z])/i);
  if (rowMatch) entities.row = rowMatch[1].toUpperCase();

  const seatMatch = lower.match(/seat\s*(\d+)/i);
  if (seatMatch) entities.seat = seatMatch[1];

  // Zone detection
  for (const [zoneId, zone] of Object.entries(STADIUM_ZONES)) {
    if (lower.includes(zone.name.toLowerCase()) || lower.includes(zoneId.replace(/_/g, ' '))) {
      entities.zone = zoneId;
      break;
    }
  }

  return {
    intent: bestIntent,
    confidence: Math.min(1, bestScore),
    entities,
  };
}

/**
 * Generate a response based on classified intent
 * @param {string} intent
 * @param {object} entities
 * @param {string} language
 * @param {object} context - Assembled context from context-manager
 * @returns {Promise<{ text: string, richData?: object, type: string }>}
 */
export async function generateResponse(intent, entities, language, context) {
  const lang = language || 'en';
  const templates = RESPONSE_TEMPLATES;

  // Simulate 200-600ms GenAI processing time
  await new Promise(r => setTimeout(r, 200 + Math.random() * 400));

  switch (intent) {
    case 'greeting':
      return {
        text: templates.welcome[lang] || templates.welcome.en,
        type: 'text',
      };

    case 'wayfinding': {
      const isAccessible = context?.accessibility?.wheelchair;
      const routeData = await getRoute(
        entities.gate || 'gate_a',
        entities.section || 'section_100',
        { accessible: isAccessible }
      );
      const prefix = templates.wayfinding[lang] || templates.wayfinding.en;
      return {
        text: prefix,
        richData: { type: 'route', steps: routeData.steps, accessible: isAccessible },
        type: 'route',
      };
    }

    case 'transit': {
      const schedules = getSchedule();
      const prefix = templates.transit[lang] || templates.transit.en;
      return {
        text: prefix,
        richData: { type: 'transit', schedules: schedules.slice(0, 5) },
        type: 'transit',
      };
    }

    case 'food':
      return {
        text: templates.food[lang] || templates.food.en,
        type: 'text',
      };

    case 'medical':
      return {
        text: templates.medical[lang] || templates.medical.en,
        type: 'text',
      };

    case 'accessibility':
      return {
        text: templates.accessibility[lang] || templates.accessibility.en,
        type: 'text',
      };

    case 'ticket':
      return {
        text: `🎟️ **Your Ticket Details**:\n\n`,
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
        text: templates.fallback[lang] || templates.fallback.en,
        type: 'text',
      };
  }
}

/**
 * Process a full user message through the GenAI pipeline
 * @param {string} rawMessage - User input
 * @param {string} language - Current language setting
 * @param {Array} chatHistory - Chat history for context
 * @param {object} userProfile - User profile with accessibility prefs
 * @returns {Promise<{ text: string, richData?: object, type: string, detectedLang?: string }>}
 */
export async function processMessage(rawMessage, language, chatHistory, userProfile) {
  try {
    // 1. Sanitize input
    const clean = sanitizeHTML(rawMessage.trim());
    if (!clean) throw new Error('Empty message');

    // 2. Detect language
    const detected = detectLanguage(clean);

    // 3. Classify intent
    const { intent, confidence, entities } = classifyIntent(clean);

    // 4. Assemble context from history
    const context = assembleContext(chatHistory, userProfile);

    // 5. Generate response
    const response = await generateResponse(intent, entities, language, context);

    // 6. Compress history if needed
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
      text: RESPONSE_TEMPLATES.fallback[language] || RESPONSE_TEMPLATES.fallback.en,
      type: 'text',
      error: true,
    };
  }
}

export default { classifyIntent, generateResponse, processMessage };
