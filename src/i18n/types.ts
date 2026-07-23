import type { fr } from './fr';

export type MessageKey = keyof typeof fr;
export type Dict = Record<MessageKey, string>;
export type UiLang = 'fr' | 'en';
