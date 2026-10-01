import { useState, useEffect } from 'react';
import { useAppTranslation } from '../context/TranslationContext';

export const useAutoTranslate = (text) => {
  const { currentLang, translate } = useAppTranslation();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (!text) return;
    if (currentLang === 'en') { setTranslated(text); return; }
    let cancelled = false;
    translate(text, currentLang).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [text, currentLang]);

  return translated;
};

export const useAutoTranslateObject = (obj) => {
  const { currentLang, translateObject } = useAppTranslation();
  const [translated, setTranslated] = useState(obj);
  const objString = JSON.stringify(obj);

  useEffect(() => {
    if (!obj) return;
    if (currentLang === 'en') { setTranslated(obj); return; }
    let cancelled = false;
    translateObject(obj, currentLang).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [objString, currentLang]);

  return translated;
};