import { supabase } from '../lib/supabase'

export const BUCKET_FOTOS = 'fotos-invitados'

const cacheUrls = new Map<string, { url: string; expira: number }>()
const TTL_CACHE = 55 * 60 * 1000

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export async function subirFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.')
  }
  const ext = EXTENSIONES[archivo.type] ?? 'img'
  const ruta = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, archivo, {
    contentType: archivo.type,
    upsert: false,
  })
  if (error) throw error
  return ruta
}

export async function eliminarFoto(ruta: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([ruta])
  if (error) throw error
}

export async function getFotoUrl(ruta: string): Promise<string | null> {
  const enCache = cacheUrls.get(ruta)
  if (enCache && Date.now() < enCache.expira) return enCache.url

  const { data, error } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrl(ruta, 3600)
  if (error || !data?.signedUrl) return null

  cacheUrls.set(ruta, { url: data.signedUrl, expira: Date.now() + TTL_CACHE })
  return data.signedUrl
}