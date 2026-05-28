import { useState } from 'react'
import Chatbot from './components/Chatbot'
import Navbar from './components/Navbar'
import Admin from './pages/Admin'
import Home from './pages/Home'
import Reservas from './pages/Reservas'

/**
 * Orquestador principal: controla qué página renderizar según el estado del Navbar.
 * paginaActual: 'home' | 'reservas'
 */
export default function App() {
  const [paginaActual, setPaginaActual] = useState('home')

  const cambiarPagina = (pagina) => {
    setPaginaActual(pagina)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <Navbar paginaActual={paginaActual} setPaginaActual={cambiarPagina} />

      <main id="contenido">
        {paginaActual === 'home' && <Home setPaginaActual={cambiarPagina} />}
        {paginaActual === 'reservas' && <Reservas setPaginaActual={cambiarPagina} />}
        {paginaActual === 'admin' && <Admin />}
      </main>

      <footer className="app-footer">
        © 2026 Guachinche El Realejo. Proyecto de Portfolio de Desarrollo Web.
      </footer>

      <Chatbot setPaginaActual={cambiarPagina} />
    </div>
  )
}
