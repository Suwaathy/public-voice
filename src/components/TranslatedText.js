import React, { useState, useEffect } from 'react';
import { useAppTranslation } from '../context/TranslationContext';

const TranslatedText = ({ text, style, tag: Tag = 'span' }) => {
  const { currentLang, translate } = useAppTranslation();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (!text) return;
    if (currentLang === 'en') { setTranslated(text); return; }
    let cancelled = false;
    translate(text, currentLang).then(r => { if (!cancelled) setTranslated(r); });
    return () => { cancelled = true; };
  }, [text, currentLang]);

  return <Tag style={style}>{translated}</Tag>;
};

export default TranslatedText;