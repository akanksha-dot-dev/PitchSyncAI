import { test } from 'node:test';
import assert from 'node:assert';
import { detectLanguage, translateText, getSupportedLanguages } from '../services/translation.js';

test('detectLanguage detects scripts correctly', () => {
  // Spanish
  assert.strictEqual(detectLanguage('¿Dónde está mi asiento?').language, 'es');
  // Arabic
  assert.strictEqual(detectLanguage('أين مقعدي؟').language, 'ar');
  // Japanese
  assert.strictEqual(detectLanguage('私の席はどこですか？').language, 'ja');
  // Korean
  assert.strictEqual(detectLanguage('제 좌석은 어디인가요?').language, 'ko');
  // Default/English
  assert.strictEqual(detectLanguage('Where is my seat?').language, 'en');
});

test('detectLanguage detects common language words', () => {
  assert.strictEqual(detectLanguage('hola amigo').language, 'es');
  assert.strictEqual(detectLanguage('bonjour monsieur').language, 'fr');
  assert.strictEqual(detectLanguage('hallo welt').language, 'de');
});

test('translateText dictionary lookups and translations', async () => {
  // Test dictionary translation
  const esTrans = await translateText('Where is my seat?', 'es');
  assert.strictEqual(esTrans.translatedText, '¿Dónde está mi asiento?');

  const frTrans = await translateText('Where is my seat?', 'fr');
  assert.strictEqual(frTrans.translatedText, 'Où est ma place?');

  // Test fallback formatting
  const zhTrans = await translateText('Welcome to the stadium', 'zh');
  assert.strictEqual(zhTrans.translatedText, '[中文] Welcome to the stadium');
});

test('getSupportedLanguages returns list', () => {
  const list = getSupportedLanguages();
  assert.ok(Array.isArray(list));
  assert.ok(list.length > 5);
  assert.ok(list.some(l => l.code === 'en'));
});
