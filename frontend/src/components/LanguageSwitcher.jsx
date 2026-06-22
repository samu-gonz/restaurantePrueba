import { useTranslation } from 'react-i18next'

import './LanguageSwitcher.css'

const IDIOMAS = [
  { code: 'es', labelKey: 'lang.es' },
  { code: 'en', labelKey: 'lang.en' },
  { code: 'fr', labelKey: 'lang.fr' },
  { code: 'de', labelKey: 'lang.de' },
]

export default function LanguageSwitcher({ compact = false }) {
  const { t, i18n } = useTranslation()

  return (
    <div
      className={compact ? 'lang-switcher lang-switcher--compact' : 'lang-switcher'}
      role="group"
      aria-label={t('lang.label')}
    >
      {IDIOMAS.map(({ code, labelKey }) => (
        <button
          key={code}
          type="button"
          className={
            i18n.language === code
              ? 'lang-switcher__btn lang-switcher__btn--active'
              : 'lang-switcher__btn'
          }
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={i18n.language === code}
          title={t(labelKey)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
