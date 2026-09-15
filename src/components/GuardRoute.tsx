import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuard } from '../hooks/useGuard'
import LoadingScreen from './LoadingScreen'

export default function GuardRoute({ children }: { children: ReactNode }) {
  const { estado, signOut } = useGuard()
  const navigate = useNavigate()

  useEffect(() => {
    if (estado === 'sin-sesion' || estado === 'denegado') {
      if (estado === 'denegado') void signOut()
      navigate('/guardia/login', { replace: true })
    }
  }, [estado, navigate, signOut])

  if (estado === 'cargando') return <LoadingScreen etiqueta="Verificando acceso..." />
  if (estado === 'autorizado') return <>{children}</>
  return null
}