import { useContext } from 'react'
import { GuardiaContext } from '../context/GuardiaContext'

export function useGuard() {
  const ctx = useContext(GuardiaContext)
  if (!ctx) throw new Error('useGuard debe usarse dentro de <GuardiaProvider>.')
  return ctx
}