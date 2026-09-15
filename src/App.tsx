import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import GuardLogin from './pages/GuardLogin'
import GuardDashboard from './pages/GuardDashboard'
import GuardRoute from './components/GuardRoute'
import LoadingScreen from './components/LoadingScreen'

const GuestRegistration = lazy(() => import('./pages/GuestRegistration'))
const GuestQR = lazy(() => import('./pages/GuestQR'))
const GuardScanner = lazy(() => import('./pages/GuardScanner'))

function SuspensePagina({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingScreen etiqueta="Cargando..." />}>{children}</Suspense>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/invitado"
        element={
          <SuspensePagina>
            <GuestRegistration />
          </SuspensePagina>
        }
      />
      <Route
        path="/invitado/qr"
        element={
          <SuspensePagina>
            <GuestQR />
          </SuspensePagina>
        }
      />
      <Route path="/guardia/login" element={<GuardLogin />} />
      <Route
        path="/guardia"
        element={
          <GuardRoute>
            <GuardDashboard />
          </GuardRoute>
        }
      />
      <Route
        path="/guardia/escanear"
        element={
          <GuardRoute>
            <SuspensePagina>
              <GuardScanner />
            </SuspensePagina>
          </GuardRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App