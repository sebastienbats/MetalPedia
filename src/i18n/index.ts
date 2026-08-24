'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';

// ═══════════════════════════════════════════
// RESSOURCES DE TRADUCTION
// ═══════════════════════════════════════════

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// ═══════════════════════════════════════════
// INITIALISATION I18NEXT
// ═══════════════════════════════════════════

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React échappe déjà
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'metalpedia-language',
    },
  });

export default i18n;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Change la langue de l'application
 */
export function changeLanguage(lng: 'fr' | 'en') {
  i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem('metalpedia-language', lng);
  }
}

/**
 * Récupère la langue actuelle
 */
export function getCurrentLanguage(): string {
  return i18n.language;
}

/**
 * Langues disponibles
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
] as const;
