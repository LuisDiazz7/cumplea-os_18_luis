import { useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Cake } from 'lucide-react'
import { toPng } from 'html-to-image'
import QRCodeDisplay from '../components/QRCodeDisplay'
import Avatar from '../components/Avatar'
import type { Invitado } from '../types/database'

const CLAVE_SESION = 'invitacion-luis-18'
const PIXEL_TRANSPARENTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

function esperar(ms: number) {
  return new Promise<void>((resolver) => window.setTimeout(resolver, ms))
}

function crearImagenDesdeBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolver, rechazar) => {
    const img = new Image()
    img.onload = () => resolver(img)
    img.onerror = () => rechazar(new Error('No se pudo decodificar la foto'))
    img.src = URL.createObjectURL(blob)
  })
}

async function fotoParaCaptura(img: HTMLImageElement): Promise<string | null> {
  try {
    const respuesta = await fetch(img.src, { credentials: 'omit' })
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
    const blob = await respuesta.blob()

    const fuente =
      'createImageBitmap' in window ? await createImageBitmap(blob) : await crearImagenDesdeBlob(blob)

    const maxLado = 600
    const escala = Math.min(1, maxLado / Math.max(fuente.width, fuente.height))
    const ancho = Math.max(1, Math.round(fuente.width * escala))
    const alto = Math.max(1, Math.round(fuente.height * escala))

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new Error('Sin contexto 2D')
    ctx.drawImage(fuente, 0, 0, ancho, alto)
    if ('close' in fuente && typeof fuente.close === 'function') fuente.close()

    return lienzo.toDataURL('image/jpeg', 0.9)
  } catch (error) {
    console.warn('[guardar-invitacion] No se pudo convertir la foto a data URL:', error)
    return null
  }
}

async function esperarImagenes(contenedor: HTMLElement, msMaximo = 6000): Promise<number> {
  const inicio = Date.now()
  let avatar = contenedor.querySelector<HTMLImageElement>('.qr-perfil__avatar img')
  while (!avatar && Date.now() - inicio < msMaximo) {
    await esperar(120)
    avatar = contenedor.querySelector<HTMLImageElement>('.qr-perfil__avatar img')
  }

  const pendientes = Array.from(contenedor.querySelectorAll('img'))
  for (const img of pendientes) {
    if (img.complete && img.naturalWidth > 0) continue
    await new Promise<void>((resolver) => {
      const tope = window.setTimeout(resolver, msMaximo)
      img.addEventListener('load', () => { window.clearTimeout(tope); resolver() }, { once: true })
      img.addEventListener('error', () => { window.clearTimeout(tope); resolver() }, { once: true })
    })
  }
  return pendientes.length
}

function descargarPng(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export default function GuestQR() {
  const invitacionRef = useRef<HTMLDivElement | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const invitado = useMemo<Invitado | null>(() => {
    try {
      const crudo = sessionStorage.getItem(CLAVE_SESION)
      if (!crudo) return null
      const obj = JSON.parse(crudo) as Invitado
      if (!obj?.codigo_qr || !obj?.nombre) return null
      return obj
    } catch {
      return null
    }
  }, [])

  if (!invitado) {
    return <Navigate to="/invitado" replace />
  }

  async function guardarInvitacion(invitado: Invitado) {
    const contenedor = invitacionRef.current
    if (!contenedor || guardando) return
    setGuardando(true)
    setMensaje(null)

    console.log('[guardar-invitacion] inicio')
    try {
      console.log('[guardar-invitacion] esperando fuentes')
      await document.fonts.ready
      console.log('[guardar-invitacion] fuentes listas')

      console.log('[guardar-invitacion] esperando imágenes')
      const totalImagenes = await esperarImagenes(contenedor)
      console.log('[guardar-invitacion] imágenes esperadas', { totalImagenes })

      let fotoDataUrl: string | null = null
      const avatar = contenedor.querySelector<HTMLImageElement>('.qr-perfil__avatar img')
      if (avatar) {
        console.log('[guardar-invitacion] capturando foto desde signed URL', {
          inicio: avatar.src.slice(0, 120),
        })
        fotoDataUrl = await fotoParaCaptura(avatar)
        console.log('[guardar-invitacion] foto lista', {
          esDataUrl: typeof fotoDataUrl === 'string',
          longitud: fotoDataUrl?.length ?? 0,
        })
      } else {
        console.log('[guardar-invitacion] sin foto (avatar con iniciales)')
      }

      console.log('[guardar-invitacion] generando PNG')
      let avatarRestauracion: { img: HTMLImageElement; src: string; loading: HTMLImageElement['loading'] } | null = null
      if (avatar && fotoDataUrl) {
        avatarRestauracion = { img: avatar, src: avatar.src, loading: avatar.loading }
        avatar.src = fotoDataUrl
        avatar.loading = 'eager'
        await esperar(30)
      }

      let dataUrl: string
      try {
        dataUrl = await toPng(contenedor, {
          pixelRatio: 2,
          backgroundColor: '#080808',
          imagePlaceholder: PIXEL_TRANSPARENTE,
        })
      } finally {
        if (avatarRestauracion) {
          avatarRestauracion.img.src = avatarRestauracion.src
          avatarRestauracion.img.loading = avatarRestauracion.loading
          avatarRestauracion.img.srcset = ''
        }
      }
      console.log('[guardar-invitacion] PNG generado', { longitud: dataUrl.length })

      console.log('[guardar-invitacion] iniciando descarga')
      const respuesta = await fetch(dataUrl)
      const blob = await respuesta.blob()

      const limpio = invitado.nombre.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-')
      const nombreArchivo = `invitacion-luis-${limpio || 'invitado'}.png`

      descargarPng(blob, nombreArchivo)

      console.log('[guardar-invitacion] descarga terminada')
      setMensaje({ tipo: 'ok', texto: '¡Invitación guardada!' })
    } catch (error) {
      console.error('[guardar-invitacion][ERROR]', {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error,
      })
      setMensaje({ tipo: 'error', texto: 'No se pudo generar la imagen. Inténtalo de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="qr-vista">
      <div
        className="qr-invitacion"
        ref={invitacionRef}
        aria-label="Invitación para capturar"
      >
        <header className="qr-perfil">
          <div className="qr-perfil__avatar" aria-hidden="true">
            <Avatar foto={invitado.foto} codigoQr={invitado.codigo_qr} nombre={invitado.nombre} tamano={122} />
          </div>
          <h1 className="qr-perfil__nombre">{invitado.nombre}</h1>
          <p className="qr-perfil__invitado">¡Estás invitado!</p>
          <p className="qr-perfil__evento">Cumpleaños Luis — 18</p>
        </header>

        <main className="qr-vista__contenido">
          <section className="qr-seccion" aria-label="Tu código QR">
            <div className="qr-seccion__card">
              <QRCodeDisplay valor={invitado.codigo_qr} />
              <p className="qr-seccion__nota">Presenta este código al llegar.</p>
            </div>
          </section>

          <section className="qr-evento" aria-label="Información del evento">
            <div className="qr-evento__card">
              <span className="qr-evento__icono" aria-hidden="true">
                <Cake size={22} />
              </span>
              <div className="qr-evento__texto">
                <p className="qr-evento__titulo">Cumpleaños 18</p>
                <p className="qr-evento__sub">Luis Díaz</p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <section className="qr-acciones" aria-label="Acciones">
        {mensaje && (
          <p className={`mensaje ${mensaje.tipo === 'ok' ? 'mensaje--ok' : 'mensaje--error'}`}>{mensaje.texto}</p>
        )}
        <button
          className="btn btn--primario btn--ancho"
          onClick={() => guardarInvitacion(invitado)}
          disabled={guardando}
        >
          {guardando ? 'GENERANDO...' : 'GUARDAR QR'}
        </button>
        <Link to="/" className="btn btn--fantasma btn--ancho">
          VOLVER AL INICIO
        </Link>
      </section>
    </div>
  )
}