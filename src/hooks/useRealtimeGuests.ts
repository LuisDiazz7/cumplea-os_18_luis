import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getInvitados } from '../services/guests'
import { getEntradas } from '../services/entries'
import { getGuardias } from '../services/auth'
import type { Entrada, Guardia, Invitado, InvitadoConEntrada } from '../types/database'

export interface UseRealtimeGuestsResult {
  invitados: InvitadoConEntrada[]
  cargando: boolean
  error: string | null
  quitarInvitadoLocal: (id: number) => void
}

export function useRealtimeGuests(): UseRealtimeGuestsResult {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [guardias, setGuardias] = useState<Guardia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const quitarInvitadoLocal = (id: number) => {
    setInvitados((prev) => prev.filter((g) => g.id !== id))
    setEntradas((prev) => prev.filter((e) => e.invitado_id !== id))
  }

  useEffect(() => {
    let activo = true

    void (async () => {
      try {
        const [inv, ent, guar] = await Promise.all([getInvitados(), getEntradas(), getGuardias()])
        if (!activo) return
        setInvitados(inv)
        setEntradas(ent)
        setGuardias(guar)
      } catch (e) {
        console.error('Error cargando datos:', e)
        if (activo) setError('No se pudieron cargar los invitados.')
      } finally {
        if (activo) setCargando(false)
      }
    })()

    const channel = supabase
      .channel('realtime-invitados')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invitados' },
        (payloadRaw) => {
          const nuevo = payloadRaw.new as Invitado
          if (activo) setInvitados((prev) => [nuevo, ...prev])
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'entradas' },
        (payloadRaw) => {
          const nueva = payloadRaw.new as Entrada
          if (activo) setEntradas((prev) => [nueva, ...prev])
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'invitados' },
        (payloadRaw) => {
          const anterior = payloadRaw.old as Invitado
          if (activo) quitarInvitadoLocal(anterior.id)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'entradas' },
        (payloadRaw) => {
          const anterior = payloadRaw.old as Entrada
          if (activo) setEntradas((prev) => prev.filter((e) => e.id !== anterior.id))
        },
      )
      .subscribe()

    return () => {
      activo = false
      void supabase.removeChannel(channel)
    }
  }, [])

  const invitadosConEntrada = useMemo<InvitadoConEntrada[]>(() => {
    return invitados.map((invitado) => {
      const entrada = entradas.find((e) => e.invitado_id === invitado.id) ?? null
      const guardia = entrada ? (guardias.find((g) => g.id === entrada.guardia_id) ?? null) : null
      return { invitado, entrada, guardia }
    })
  }, [invitados, entradas, guardias])

  return { invitados: invitadosConEntrada, cargando, error, quitarInvitadoLocal }
}