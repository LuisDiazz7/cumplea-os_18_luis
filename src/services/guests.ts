import { supabase } from '../lib/supabase'
import type { Invitado } from '../types/database'

export async function crearInvitado(nombre: string, foto: string | null): Promise<Invitado> {
  const { data, error } = await supabase.rpc('crear_invitado', {
    p_nombre: nombre,
    p_foto: foto,
  })
  if (error) throw error

  if (Array.isArray(data)) {
    const primera = data[0]
    if (!primera) throw new Error('La base de datos no devolvió el invitado creado.')
    return primera as Invitado
  }

  if (data && typeof data === 'object') {
    return data as Invitado
  }

  throw new Error('La base de datos no devolvió el invitado creado.')
}

export async function getInvitados(): Promise<Invitado[]> {
  const { data, error } = await supabase
    .from('invitados')
    .select('*')
    .order('fecha_creacion', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getInvitadoPorCodigo(codigoQr: string): Promise<Invitado | null> {
  const { data, error } = await supabase
    .from('invitados')
    .select('*')
    .eq('codigo_qr', codigoQr)
    .maybeSingle()
  if (error) throw error
  return data
}