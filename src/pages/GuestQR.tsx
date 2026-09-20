import { useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Cake } from 'lucide-react'
import QRCodeDisplay from '../components/QRCodeDisplay'
import Avatar from '../components/Avatar'
import type { Invitado } from '../types/database'

const CLAVE_SESION = 'invitacion-luis-18'

export default function GuestQR() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

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

  async function guardarTarjeta(invitado: Invitado) {
    const lienzoQr = canvasRef.current
    if (!lienzoQr || guardando) return
    setGuardando(true)
    setMensaje(null)

    try {
      const lienzo = document.createElement('canvas')
      lienzo.width = 1080
      lienzo.height = 1440
      const ctx = lienzo.getContext('2d')
      if (!ctx) throw new Error('No se pudo generar la imagen.')

      ctx.fillStyle = '#0a0a10'
      ctx.fillRect(0, 0, 1080, 1440)

      const resplandor = ctx.createRadialGradient(540, 180, 0, 540, 180, 620)
      resplandor.addColorStop(0, 'rgba(230,185,76,0.28)')
      resplandor.addColorStop(1, 'rgba(230,185,76,0)')
      ctx.fillStyle = resplandor
      ctx.fillRect(0, 0, 1080, 1440)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#e8c766'
      ctx.font = '500 40px Outfit, sans-serif'
      ctx.fillText('CUMPLEAÑOS', 540, 160)

      ctx.fillStyle = '#faf6ea'
      ctx.font = '700 110px "Playfair Display", serif'
      ctx.fillText('LUIS', 540, 320)

      ctx.fillStyle = '#d4af37'
      ctx.font = '700 170px "Playfair Display", serif'
      ctx.fillText('18', 540, 570)

      ctx.fillStyle = '#faf6ea'
      ctx.font = '600 52px Outfit, sans-serif'
      ctx.fillText(invitado.nombre.length > 28 ? invitado.nombre.slice(0, 27) + '…' : invitado.nombre, 540, 720)

      const tamanoQr = 620
      ctx.drawImage(lienzoQr, (1080 - tamanoQr) / 2, 800, tamanoQr, tamanoQr)

      ctx.fillStyle = 'rgba(244,242,236,0.75)'
      ctx.font = '400 32px Outfit, sans-serif'
      ctx.fillText('Presenta este código al llegar', 540, 1490)

      const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/png'))
      if (!blob) throw new Error('No se pudo generar la imagen.')

      const nombreArchivo = `QR-invitacion-${invitado.nombre.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-')}.png`
      const archivo = new File([blob], nombreArchivo, { type: 'image/png' })

      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: 'Mi invitación · Cumpleaños Luis 18' })
      } else {
        const url = URL.createObjectURL(blob)
        const enlace = document.createElement('a')
        enlace.href = url
        enlace.download = nombreArchivo
        enlace.click()
        URL.revokeObjectURL(url)
      }
      setMensaje('¡Invitación guardada!')
    } catch (err) {
      console.error('Error guardando tarjeta:', err)
      setMensaje('No se pudo guardar la imagen. Prueba con una captura de pantalla.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="qr-vista">
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
            <QRCodeDisplay valor={invitado.codigo_qr} canvasRef={canvasRef} />
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

        <section className="qr-acciones" aria-label="Acciones">
          {mensaje && <p className="mensaje mensaje--ok">{mensaje}</p>}
          <button
            className="btn btn--primario btn--ancho"
            onClick={() => guardarTarjeta(invitado)}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'GUARDAR QR'}
          </button>
          <Link to="/" className="btn btn--fantasma btn--ancho">
            VOLVER AL INICIO
          </Link>
        </section>
      </main>
    </div>
  )
}