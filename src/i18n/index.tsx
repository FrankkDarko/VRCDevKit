import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { fr } from './fr';
import { en } from './en';
import type { Dict, MessageKey, UiLang } from './types';

const dicts: Record<UiLang, Dict> = { fr, en };
const STORAGE_KEY = 'vrcdevkit.lang';

export function detectLang(): UiLang {
  // ?lang= wins (checked both before and inside the hash), then the stored
  // choice, then the browser language.
  const fromParams = (search: string): UiLang | null => {
    const v = new URLSearchParams(search).get('lang');
    return v === 'fr' || v === 'en' ? v : null;
  };
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?'))
    : '';
  const fromUrl = fromParams(window.location.search) ?? fromParams(hashQuery);
  if (fromUrl) return fromUrl;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fr' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  lang: UiLang;
  setLang: (lang: UiLang) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>(() => {
    const l = detectLang();
    document.documentElement.lang = l;
    return l;
  });

  const setLang = useCallback((l: UiLang) => {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
    setLangState(l);
  }, []);

  const t = useCallback<Translate>(
    (key, params) => {
      let msg: string = dicts[lang][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replaceAll(`{${k}}`, String(v));
        }
      }
      return msg;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
