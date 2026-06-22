import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

const STORAGE_KEY = 'realejo_lang'
const SUPPORTED = ['es', 'en', 'fr', 'de']

function detectarIdiomaInicial() {
  const guardado = localStorage.getItem(STORAGE_KEY)
  if (guardado && SUPPORTED.includes(guardado)) return guardado

  const navegador = (navigator.language || 'es').split('-')[0].toLowerCase()
  return SUPPORTED.includes(navegador) ? navegador : 'es'
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
  },
  lng: detectarIdiomaInicial(),
  fallbackLng: 'es',
  supportedLngs: SUPPORTED,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
  document.documentElement.lang = lng
})

document.documentElement.lang = i18n.language

export function localeFecha() {
  const mapa = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', de: 'de-DE' }
  return mapa[i18n.language] ?? 'es-ES'
}

export default i18n
