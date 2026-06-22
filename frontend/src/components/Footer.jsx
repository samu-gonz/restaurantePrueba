import { useTranslation } from 'react-i18next'
import { MAPS_URL, TELEFONO_CONTACTO, UBICACION_RESTAURANTE } from '../config/ubicacion'

export default function Footer({ onAccesoPersonal }) {
  const { t } = useTranslation()
  const direccionCompleta = `${UBICACION_RESTAURANTE.calle}, ${UBICACION_RESTAURANTE.localidad}`

  return (
    <footer className="app-footer">
      <p className="app-footer__copyright">
        © 2026 {UBICACION_RESTAURANTE.nombre}. {t('footer.tagline')}
      </p>
      <a className="app-footer__direccion" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
        {direccionCompleta}
      </a>
      <a className="app-footer__telefono" href={`tel:${TELEFONO_CONTACTO.enlace}`}>
        {TELEFONO_CONTACTO.visible}
      </a>
      {typeof onAccesoPersonal === 'function' && (
        <button type="button" className="app-footer__staff" onClick={onAccesoPersonal}>
          {t('footer.staffAccess')}
        </button>
      )}
    </footer>
  )
}
