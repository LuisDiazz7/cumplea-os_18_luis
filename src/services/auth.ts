import { supabase } from '../lib/supabase'
import type { Guardia } from '../types/database'

export async function signInGuardia(
  email: string,
  password: string,
): Promise<{ usuarioId: string | null }> {
  console.log('[Paso 1] signInWithPassword...', { email })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('[Paso 1][ERROR] signInWithPassword:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
    })
    throw error
  }
  console.log('[Paso 1][OK] signInWithPassword. usuarioId:', data.user?.id)
  return { usuarioId: data.user?.id ?? null }
}

export async function signOutGuardia(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getGuardiaPorAuthId(authId: string): Promise<Guardia | null> {
  console.log('[Paso 3] Buscando guardia con auth_id:', authId)
  const { data, error } = await supabase
    .from('guardias')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle()
  if (error) {
    const e = error as { name?: string; message?: string; code?: string; status?: number }
    console.error('[Paso 3][ERROR] Consulta a guardias:', {
      name: e.name,
      message: e.message,
      code: e.code,
      status: e.status,
      details: (e as { details?: unknown }).details,
      hint: (e as { hint?: unknown }).hint,
    })
    throw error
  }
  console.log(
    '[Paso 3][OK] guardias:',
    data ? `encontrado id=${data.id}, nombre=${data.nombre}` : 'NO existe fila con ese auth_id',
  )
  return data
}

export async function getGuardiaPorId(id: number): Promise<Guardia | null> {
  const { data, error } = await supabase.from('guardias').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getGuardias(): Promise<Guardia[]> {
  const { data, error } = await supabase.from('guardias').select('*')
  if (error) throw error
  return data ?? []
}