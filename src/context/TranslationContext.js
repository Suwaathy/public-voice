import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText, translateObject as translateObj } from '../services/translationService';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const cacheRef = useRef({});

  const changeLang = useCallback(async (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
    if (lang !== 'en') {
      setIsTranslating(true);
      setTimeout(() => setIsTranslating(false), 3000);
    }
  }, [i18n]);

  const translate = useCallback(async (text, lang = null) => {
    const target = lang || currentLang;
    if (target === 'en' || !text) return text;
    const cacheKey = `${target}:${text}`;
    if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey];
    const result = await translateText(text, target);
    cacheRef.current[cacheKey] = result;
    return result;
  }, [currentLang]);

  const translateObject = useCallback(async (obj, lang = null) => {
    const target = lang || currentLang;
    if (target === 'en') return obj;
    return translateObj(obj, target);
  }, [currentLang]);

  return (
    <TranslationContext.Provider value={{ currentLang, changeLang, translate, translateObject, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useAppTranslation = () => useContext(TranslationContext);