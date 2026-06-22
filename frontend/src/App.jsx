import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import Chatbot from './components/Chatbot'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import Admin from './pages/Admin'
import Home from './pages/Home'
import Reservas from './pages/Reservas'

/**
 * Orquestador principal: controla qué página renderizar según el estado del Navbar.
 * paginaActual: 'home' | 'reservas'
 */
export default function App() {
  const { t } = useTranslation()
  const [paginaActual, setPaginaActual] = useState('home')
  const [chatAbierto, setChatAbierto] = useState(false)

  const cambiarPagina = (pagina) => {
    setPaginaActual(pagina)
    setChatAbierto(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <a href="#contenido" className="skip-link">
        {t('common.skipToContent')}
      </a>

      <Navbar
        paginaActual={paginaActual}
        setPaginaActual={cambiarPagina}
        chatAbierto={chatAbierto}
        onToggleChat={() => setChatAbierto((prev) => !prev)}
      />

      <main id="contenido">
        {paginaActual === 'home' && <Home setPaginaActual={cambiarPagina} />}
        {paginaActual === 'reservas' && <Reservas setPaginaActual={cambiarPagina} />}
        {paginaActual === 'admin' && <Admin />}
      </main>

      <Footer onAccesoPersonal={() => cambiarPagina('admin')} />

      <Chatbot
        setPaginaActual={cambiarPagina}
        abierto={chatAbierto}
        setAbierto={setChatAbierto}
      />
    </div>
  )
}
