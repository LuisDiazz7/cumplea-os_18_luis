import { supabase } from '../lib/supabase'

export const BUCKET_FOTOS = 'fotos-invitados'

const cacheUrls = new Map<string, { url: string; expira: number }>()
const TTL_CACHE = 55 * 60 * 1000

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function uuidSeguro(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}

function extensionDesdeNombre(nombre: string): string | null {
  const punto = nombre.lastIndexOf('.')
  if (punto === -1) return null
  const ext = nombre.slice(punto + 1).toLowerCase()
  if (!ext || ext.length > 5) return null
  return ext
}

function describirError(error: unknown): Record<string, unknown> {
  const e = (error ?? {}) as {
    name?: string
    message?: string
    statusCode?: number
    status?: number
    error?: string
    cause?: unknown
  }
  return {
    name: e.name,
    message: e.message,
    statusCode: e.statusCode,
    status: e.status,
    error: e.error,
    cause: e.cause,
  }
}

export async function subirFoto(archivo: File): Promise<string> {
  const nombreOriginal = archivo.name || '(sin nombre)'
  const mime = archivo.type || ''
  const tamano = archivo.size

  if (mime !== '' && !mime.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.')
  }

  const ext = EXTENSIONES[mime] ?? extensionDesdeNombre(nombreOriginal) ?? 'img'
  const ruta = `${uuidSeguro()}.${ext}`

  console.log('[storage] Subiendo foto → bucket:', BUCKET_FOTOS, {
    nombreOriginal,
    mime,
    tamano,
    ext,
    ruta,
    contextoSeguro: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
  })

  const { data, error } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, archivo, {
    contentType: mime || 'application/octet-stream',
    upsert: false,
  })

  if (error) {
    console.error('[storage] ERROR subiendo foto al bucket:', {
      ...describirError(error),
      nombreOriginal,
      mime,
      tamano,
      ext,
      ruta,
      bucket: BUCKET_FOTOS,
    })
    throw error
  }

  console.log('[storage] Foto subida OK →', { ruta, path: data?.path })
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