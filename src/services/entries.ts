import { supabase } from '../lib/supabase'
import type { Entrada } from '../types/database'

export async function getEntradas(): Promise<Entrada[]> {
  const { data, error } = await supabase
    .from('entradas')
    .select('*')
    .order('hora_entrada', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getEntradaDeInvitado(invitadoId: number): Promise<Entrada | null> {
  const { data, error } = await supabase
    .from('entradas')
    .select('*')
    .eq('invitado_id', invitadoId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function registrarEntrada(
  invitadoId: number,
  guardiaId: number,
  regalo: string,
): Promise<Entrada> {
  const regaloFinal = regalo.trim() === '' ? null : regalo.trim()
  const { data, error } = await supabase
    .from('entradas')
    .insert({
      invitado_id: invitadoId,
      guardia_id: guardiaId,
      regalo: regaloFinal,
    })
    .select()
    .single()
  if (error) throw error
  return data
}