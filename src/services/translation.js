/**
 * @module translation
 * @description Mocked Google Cloud Translation API for PitchSync AI.
 *
 * Provides language detection via Unicode script analysis and common-word
 * matching, plus dictionary-based translation for key stadium phrases in
 * 9 languages. Simulates realistic API latency (100–300 ms).
 *
 * In production, swap `translateText()` internals with the real
 * Google Cloud Translation v3 client.
 */

import { LANGUAGES } from '../utils/constants.js';

// ---- Common Stadium Phrase Dictionary ----
const PHRASE_DICT = Object.freeze({
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
    'Where is my seat?': 'Wo ist mein Platz?',
    'Find food nearby': 'Essen in der Nähe finden',
    'Show transit schedule': 'Fahrplan anzeigen',
    'I need medical help': 'Ich brauche medizinische Hilfe',
    'Gate': 'Tor',
    'Section': 'Sektor',
  },
  ja: {
    'Where is my seat?': '私の席はどこですか？',
    'Find food nearby': '近くの食べ物を探す',
    'Show transit schedule': '時刻表を表示',
    'I need medical help': '救護が必要です',
    'Gate': 'ゲート',
  },
  ko: {
    'Where is my seat?': '내 좌석이 어디인가요?',
    'Find food nearby': '근처 음식 찾기',
    'I need medical help': '의료 도움이 필요합니다',
  },
  zh: {
    'Where is my seat?': '我的座位在哪里？',
    'Find food nearby': '寻找附近的食物',
    'I need medical help': '需要医疗帮助',
  },
  hi: {
    'Where is my seat?': 'मेरी सीट कहाँ है?',
    'Find food nearby': 'पास का खाना खोजें',
    'I need medical help': 'मुझे चिकित्सा सहायता चाहिए',
  },
});

/**
 * Detect language of input text using Unicode script analysis & phrase matching.
 *
 * @param {string} text - User message input string
 * @returns {string} ISO 639-1 language code ('en', 'es', 'fr', 'ar', etc.)
 *
 * @example
 * detectLanguage('¿Dónde está mi asiento?') // => 'es'
 * detectLanguage('私の席はどこですか？')      // => 'ja'
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  // Script-based detection
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';

  const lower = text.toLowerCase();

  // Spanish keywords
  if (/\b(dónde|dónde|asiento|comida|médica|hola|gracias|puerta|por favor|ayuda)\b/.test(lower)) return 'es';
  // French keywords
  if (/\b(où|siège|nourriture|médicale|bonjour|merci|porte|s'il vous plaît|aide)\b/.test(lower)) return 'fr';
  // Portuguese keywords
  if (/\b(onde|assento|comida|médica|olá|obrigado|portão|por favor|ajuda)\b/.test(lower)) return 'pt';
  // German keywords
  if (/\b(wo|platz|essen|hilfe|hallo|danke|tor|bitte)\b/.test(lower)) return 'de';

  return 'en';
}

/**
 * Translate text string into target language using local phrase dictionary or echo fallback.
 *
 * @param {string} text - Text phrase to translate
 * @param {string} targetLang - Target ISO 639-1 language code (e.g. 'es')
 * @returns {Promise<{ translatedText: string, sourceLang: string, targetLang: string }>} Translation result payload
 *
 * @example
 * const res = await translateText('Where is my seat?', 'es');
 * console.log(res.translatedText); // => '¿Dónde está mi asiento?'
 */
export function translateText(text, targetLang) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!targetLang || targetLang === 'en') {
        resolve({ translatedText: text, sourceLang: 'en', targetLang: 'en' });
        return;
      }

      const dict = PHRASE_DICT[targetLang];
      const translated = dict?.[text] || text;

      resolve({
        translatedText: translated,
        sourceLang: detectLanguage(text),
        targetLang,
      });
    }, 100);
  });
}

/**
 * Get list of all supported stadium languages and metadata.
 *
 * @returns {Array<{ code: string, name: string, nativeName: string, flag: string, rtl?: boolean }>} Array of language objects
 */
export function getSupportedLanguages() {
  return Object.values(LANGUAGES);
}
