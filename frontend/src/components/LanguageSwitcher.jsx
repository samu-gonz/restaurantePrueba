import { useTranslation } from 'react-i18next'

import './LanguageSwitcher.css'

const IDIOMAS = [
  { code: 'es', labelKey: 'lang.es', flagSrc: '/flags/es.svg' },
  { code: 'en', labelKey: 'lang.en', flagSrc: '/flags/gb.svg' },
  { code: 'fr', labelKey: 'lang.fr', flagSrc: '/flags/fr.svg' },
  { code: 'de', labelKey: 'lang.de', flagSrc: '/flags/de.svg' },
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
      {IDIOMAS.map(({ code, labelKey, flagSrc }) => {
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
            <img
              className="lang-switcher__flag"
              src={flagSrc}
              alt=""
              width={28}
              height={19}
              loading="lazy"
              decoding="async"
            />
          </button>
        )
      })}
    </div>
  )
}
