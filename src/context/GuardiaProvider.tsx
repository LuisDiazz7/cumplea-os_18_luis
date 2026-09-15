import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { GuardiaContext } from './GuardiaContext'
import type { EstadoAcceso } from './GuardiaContext'
import type { Guardia } from '../types/database'

export default function GuardiaProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [verificandoAuth, setVerificandoAuth] = useState(true)
  const [guardiaEstado, setGuardiaEstado] = useState<{
    paraUsuario: string | null
    valor: Guardia | null
  }>({ paraUsuario: null, valor: null })

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setUsuario(sesion?.user ?? null)
    })

    void (async () => {
      const { data } = await supabase.auth.getUser()
      setUsuario(data.user)
      setVerificandoAuth(false)
    })()

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!usuario) return

    let activo = true
    void (async () => {
      console.log('[GuardiaProvider] Buscando guardia para usuario Auth:', usuario.id)
      const { data, error } = await supabase
        .from('guardias')
        .select('*')
        .eq('auth_id', usuario.id)
        .maybeSingle()
      if (!activo) return
      if (error) {
        const e = error as { name?: string; message?: string; code?: string; status?: number }
        console.error('[GuardiaProvider][ERROR] Consulta guardias:', {
          name: e.name,
          message: e.message,
          code: e.code,
          status: e.status,
        })
      } else {
        console.log(
          '[GuardiaProvider][OK]',
          data ? `guardia encontrado: ${data.nombre}` : 'sin fila en guardias',
        )
      }
      setGuardiaEstado({ paraUsuario: usuario.id, valor: data ?? null })
    })()

    return () => {
      activo = false
    }
  }, [usuario])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const guardia = usuario && guardiaEstado.paraUsuario === usuario.id ? guardiaEstado.valor : null
  const cargandoGuardia = usuario !== null && guardiaEstado.paraUsuario !== usuario.id

  let estado: EstadoAcceso = 'sin-sesion'
  if (verificandoAuth || cargandoGuardia) estado = 'cargando'
  else if (usuario && guardia) estado = 'autorizado'
  else if (usuario && !guardia) estado = 'denegado'

  return (
    <GuardiaContext.Provider value={{ usuario, guardia, estado, signOut }}>
      {children}
    </GuardiaContext.Provider>
  )
}