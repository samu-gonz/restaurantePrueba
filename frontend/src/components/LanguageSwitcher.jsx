import { useTranslation } from 'react-i18next'

import './LanguageSwitcher.css'

const IDIOMAS = [
  { code: 'es', labelKey: 'lang.es', flag: '🇪🇸' },
  { code: 'en', labelKey: 'lang.en', flag: '🇬🇧' },
  { code: 'fr', labelKey: 'lang.fr', flag: '🇫🇷' },
  { code: 'de', labelKey: 'lang.de', flag: '🇩🇪' },
]

export default function LanguageSwitcher({ compact = false }) {
  const { t, i18n } = useTranslation()
  const idiomaActivo = i18n.language?.split('-')[0] ?? 'es'

  return (
    <div
      className={compact ? 'lang-switcher lang-switcher--compact' : 'lang-switcher'}
      role="group"
      aria-label={t('lang.label')}
    >
      {IDIOMAS.map(({ code, labelKey, flag }) => {
        const activo = idiomaActivo === code
        const nombre = t(labelKey)

        return (
          <button
            key={code}
            type="button"
            className={activo ? 'lang-switcher__btn lang-switcher__btn--active' : 'lang-switcher__btn'}
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={activo}
            aria-label={nombre}
            title={nombre}
          >
            <span className="lang-switcher__flag" aria-hidden="true">
              {flag}
            </span>
          </button>
        )
      })}
    </div>
  )
}
