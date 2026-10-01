import axios from 'axios';

const cache = {};

export const translateText = async (text, targetLang) => {
  if (!text || !text.trim() || targetLang === 'en') return text;

  const key = `${targetLang}:${text}`;
  if (cache[key]) return cache[key];

  // Try MyMemory first (free, no key needed, reliable)
  try {
    const langPair = targetLang === 'ta' ? 'en|ta' : 'en|si';
    const res = await axios.get('https://api.mymemory.translated.net/get', {
      params: { q: text, langpair: langPair },
      timeout: 6000,
    });
    const result = res.data.responseData.translatedText;
    if (result && result !== text) {
      cache[key] = result;
      return result;
    }
  } catch (err) {
    console.warn('MyMemory failed:', err.message);
  }

  // Try LibreTranslate as fallback
  try {
    const res = await axios.post(
      'https://libretranslate.com/translate',
      { q: text, source: 'en', target: targetLang, format: 'text' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 6000 }
    );
    const result = res.data.translatedText;
    if (result) {
      cache[key] = result;
      return result;
    }
  } catch (err) {
    console.warn('LibreTranslate failed:', err.message);
  }

  return text;
};

export const translateBatch = async (texts, targetLang) => {
  if (targetLang === 'en') return texts;
  return Promise.all(texts.map(t => translateText(t, targetLang)));
};

export const translateObject = async (obj, targetLang) => {
  if (targetLang === 'en') return obj;
  const entries = await Promise.all(
    Object.entries(obj).map(async ([key, val]) => {
      if (typeof val === 'string' && val.length > 0) {
        return [key, await translateText(val, targetLang)];
      }
      return [key, val];
    })
  );
  return Object.fromEntries(entries);
};