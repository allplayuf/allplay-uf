/**
 * Language provider — lightweight i18n.
 *
 * Two supported languages: `en` (English, default) and `sv` (Swedish).
 *
 *   const { t, lang, setLang } = useT();
 *   <h1>{t('nav.dashboard')}</h1>
 *   <p>{t('settings.delete.confirm_button')}</p>
 *
 * `t(key, params?)` returns the translation. If a key is missing in the
 * current language, it falls back to Swedish. If a key is missing in both,
 * the key itself is returned (useful for spotting un-keyed strings).
 *
 * Values may be functions for interpolation:
 *   sv: { 'welcome': ({name}) => `Hej ${name}!` }
 *   t('welcome', { name: 'Matija' })
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sv, en } from './strings';

const STORAGE_KEY = 'allplay_lang';
const DEFAULT_LANG = 'en';
const FALLBACK_LANG = 'sv';

const DICTS = { sv, en };

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (k) => k,
});

// Keep Swedish as the translation fallback even though English is the default.

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'sv' || stored === 'en') return stored;
  } catch {
    /* localStorage blocked — fall through */
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  // Keep <html lang="..."> in sync so accessibility tools + spell-checkers
  // know which language the page is rendered in.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (next !== 'sv' && next !== 'en') return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
  }, []);

  const t = useCallback(
    (key, params) => {
      const dict = DICTS[lang] || DICTS[FALLBACK_LANG];
      let val = dict[key];
      if (val === undefined) val = DICTS[FALLBACK_LANG][key];
      if (val === undefined) return key;
      if (typeof val === 'function') {
        try {
          return val(params || {});
        } catch {
          return key;
        }
      }
      return val;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}
