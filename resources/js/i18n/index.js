import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import pt from './locales/pt.json'
import en from './locales/en.json'

/**
 * Setup i18next do Reactify.
 *
 * Estratégia:
 *  - Dois idiomas: português brasileiro (padrão) e inglês.
 *  - Detecção automática na primeira visita via LanguageDetector
 *    (ordem: localStorage → navigator). Se o idioma do browser não
 *    bater com nenhum dos suportados, cai no fallback `pt`.
 *  - Persistência em `localStorage` com a chave `reactify-lang`.
 *  - Namespace único `common` — todas as strings ficam em um arquivo
 *    por idioma. Simplifica migração e busca.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { common: pt },
      en: { common: en },
    },
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en'],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false, // React já escapa
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'reactify-lang',
      caches: ['localStorage'],
    },
    returnEmptyString: false,
  })

export default i18n
