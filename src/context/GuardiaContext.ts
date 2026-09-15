import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Guardia } from '../types/database'

export type EstadoAcceso = 'cargando' | 'sin-sesion' | 'autorizado' | 'denegado'

export interface GuardiaContextValue {
  usuario: User | null
  guardia: Guardia | null
  estado: EstadoAcceso
  signOut: () => Promise<void>
}

export const GuardiaContext = createContext<GuardiaContextValue | null>(null)