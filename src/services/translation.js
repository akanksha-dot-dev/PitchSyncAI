/* ============================================================
   FIFA MatchDay GenAI Nexus — Translation Service (Mocked)
   Simulated Google Cloud Translation API
   ============================================================ */

import { LANGUAGES } from '../utils/constants.js';

// ---- Common Stadium Phrase Dictionary ----
const PHRASE_DICT = {
  es: {
    'Where is my seat?': '¿Dónde está mi asiento?',
    'Find food nearby': 'Encontrar comida cercana',
    'Show transit schedule': 'Mostrar horario de transporte',
    'I need medical help': 'Necesito ayuda médica',
    'Accessible route please': 'Ruta accesible por favor',
    'Where is the restroom?': '¿Dónde está el baño?',
    'Show my ticket': 'Mostrar mi boleto',
    'Gate': 'Puerta',
    'Section': 'Sección',
    'Row': 'Fila',
    'Seat': 'Asiento',
  },
  fr: {
    'Where is my seat?': 'Où est ma place?',
    'Find food nearby': 'Trouver de la nourriture à proximité',
    'Show transit schedule': 'Afficher les horaires de transport',
    'I need medical help': "J'ai besoin d'aide médicale",
    'Accessible route please': 'Itinéraire accessible s\'il vous plaît',
    'Where is the restroom?': 'Où sont les toilettes?',
    'Show my ticket': 'Afficher mon billet',
    'Gate': 'Porte',
    'Section': 'Section',
    'Row': 'Rangée',
    'Seat': 'Siège',
  },
  ar: {
    'Where is my seat?': 'أين مقعدي؟',
    'Find food nearby': 'ابحث عن طعام قريب',
    'Show transit schedule': 'عرض جدول النقل',
    'I need medical help': 'أحتاج مساعدة طبية',
    'Where is the restroom?': 'أين الحمام؟',
    'Gate': 'بوابة',
    'Section': 'قسم',
  },
  pt: {
    'Where is my seat?': 'Onde é meu assento?',
    'Find food nearby': 'Encontrar comida por perto',
    'Show transit schedule': 'Mostrar horário de transporte',
    'I need medical help': 'Preciso de ajuda médica',
    'Gate': 'Portão',
    'Section': 'Seção',
  },
  de: {
    'Where is my seat?': 'Wo ist mein Sitzplatz?',
    'Find food nearby': 'Essen in der Nähe finden',
    'I need medical help': 'Ich brauche medizinische Hilfe',
    'Gate': 'Tor',
    'Section': 'Abschnitt',
  },
  ja: {
    'Where is my seat?': '私の席はどこですか？',
    'Find food nearby': '近くの食べ物を探す',
    'Gate': 'ゲート',
    'Section': 'セクション',
  },
  ko: {
    'Where is my seat?': '제 좌석은 어디인가요?',
    'Find food nearby': '근처 음식 찾기',
    'Gate': '게이트',
  },
  zh: {
    'Where is my seat?': '我的座位在哪里？',
    'Find food nearby': '查找附近的食物',
    'Gate': '入口',
    'Section': '区域',
  },
  hi: {
    'Where is my seat?': 'मेरी सीट कहाँ है?',
    'Find food nearby': 'पास में खाना खोजें',
    'Gate': 'गेट',
  },
};

// ---- Language Detection Patterns ----
const LANG_PATTERNS = {
  es: /[¿¡áéíóúñü]/i,
  fr: /[àâçéèêëîïôùûüÿœæ]/i,
  ar: /[\u0600-\u06FF]/,
  ja: /[\u3040-\u309F\u30A0-\u30FF]/,
  ko: /[\uAC00-\uD7AF]/,
  zh: /[\u4E00-\u9FFF]/,
  hi: /[\u0900-\u097F]/,
  pt: /[ãõçáéíóú]/i,
  de: /[äöüß]/i,
};

/**
 * Detect the language of input text
 * @param {string} text
 * @returns {{ language: string, confidence: number }}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { language: 'en', confidence: 0.5 };
  }

  // Check character patterns
  for (const [lang, pattern] of Object.entries(LANG_PATTERNS)) {
    if (pattern.test(text)) {
      return { language: lang, confidence: 0.85 };
    }
  }

  // Check common words
  const lower = text.toLowerCase();
  const wordPatterns = {
    es: ['hola', 'dónde', 'ayuda', 'necesito', 'por favor', 'gracias'],
    fr: ['bonjour', 'merci', 'aide', 'comment', 's\'il vous plaît'],
    pt: ['olá', 'obrigado', 'ajuda', 'onde', 'por favor'],
    de: ['hallo', 'hilfe', 'danke', 'bitte', 'wo ist'],
  };

  for (const [lang, words] of Object.entries(wordPatterns)) {
    if (words.some(w => lower.includes(w))) {
      return { language: lang, confidence: 0.75 };
    }
  }

  // Default to English
  return { language: 'en', confidence: 0.90 };
}

/**
 * Translate text to a target language (mocked)
 * Simulates Google Cloud Translation API
 * @param {string} text
 * @param {string} targetLang - ISO 639-1 code
 * @returns {Promise<{ translatedText: string, sourceLang: string }>}
 */
export async function translateText(text, targetLang) {
  // Simulate API latency (100-300ms)
  await new Promise(r => setTimeout(r, 100 + Math.random() * 200));

  if (targetLang === 'en') {
    return { translatedText: text, sourceLang: 'en' };
  }

  const dict = PHRASE_DICT[targetLang];
  if (dict) {
    // Check exact match in dictionary
    if (dict[text]) {
      return { translatedText: dict[text], sourceLang: 'en' };
    }

    // Check partial match
    for (const [eng, translated] of Object.entries(dict)) {
      if (text.toLowerCase().includes(eng.toLowerCase())) {
        const result = text.replace(new RegExp(eng, 'gi'), translated);
        return { translatedText: result, sourceLang: 'en' };
      }
    }
  }

  // Fallback: return original with language indicator
  const langInfo = LANGUAGES[targetLang];
  return {
    translatedText: `[${langInfo?.name || targetLang}] ${text}`,
    sourceLang: 'en',
  };
}

/**
 * Get all supported languages
 * @returns {Array<{ code: string, name: string, flag: string }>}
 */
export function getSupportedLanguages() {
  return Object.entries(LANGUAGES).map(([code, info]) => ({
    code,
    ...info,
  }));
}

export default { detectLanguage, translateText, getSupportedLanguages };
