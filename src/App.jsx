import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Reservas from './pages/Reservas'

/**
 * Enrutador principal de la aplicación multipágina.
 *
 * Rutas:
 *  - `/`        → Home (Navbar + Hero + Bento + Carta)
 *  - `/reservar` → Gestión de reservas con aforo simulado (30 mesas/turno)
 *
 * El Navbar es común a todas las rutas e incluye el CTA "Reservar Mesa".
 */
export default function App() {
  return (
    <BrowserRouter>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reservar" element={<Reservas />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
