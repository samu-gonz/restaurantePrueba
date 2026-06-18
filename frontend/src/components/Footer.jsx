/** Sustituye por el teléfono real del local (solo dígitos en enlace, con +34). */
const TELEFONO_ENLACE = '+34922123456'
const TELEFONO_VISIBLE = '+34 922 123 456'

export default function Footer() {
  return (
    <footer className="app-footer">
      <p className="app-footer__copyright">
        © 2026 Guachinche El Realejo. Proyecto de Portfolio de Desarrollo Web.
      </p>
      <a className="app-footer__telefono" href={`tel:${TELEFONO_ENLACE}`}>
        {TELEFONO_VISIBLE}
      </a>
    </footer>
  )
}
