import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export type EstadoCamara = 'solicitando' | 'activa' | 'denegado' | 'no-disponible' | 'error'

interface QRScannerProps {
  onScan: (contenido: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const onScanRef = useRef(onScan)
  const [estado, setEstado] = useState<EstadoCamara>('solicitando')

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    let activo = true

    const detener = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado('no-disponible')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (!activo) {
          stream.getTracks().forEach((track) => track.stop())
          detener()
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) {
          stream.getTracks().forEach((track) => track.stop())
          detener()
          return
        }
        video.srcObject = stream
        await video.play()
        setEstado('activa')

        const escanear = () => {
          const v = videoRef.current
          if (!v || v.readyState < 2) {
            rafRef.current = requestAnimationFrame(escanear)
            return
          }
          const ancho = v.videoWidth
          const alto = v.videoHeight
          if (!ancho || !alto) {
            rafRef.current = requestAnimationFrame(escanear)
            return
          }
          const lienzo = document.createElement('canvas')
          lienzo.width = ancho
          lienzo.height = alto
          const ctx = lienzo.getContext('2d', { willReadFrequently: true })
          if (!ctx) {
            rafRef.current = requestAnimationFrame(escanear)
            return
          }
          ctx.drawImage(v, 0, 0, ancho, alto)
          const imagen = ctx.getImageData(0, 0, ancho, alto)
          const codigo = jsQR(imagen.data, ancho, alto, { inversionAttempts: 'dontInvert' })
          if (codigo && codigo.data) {
            detener()
            onScanRef.current(codigo.data)
            return
          }
          rafRef.current = requestAnimationFrame(escanear)
        }
        rafRef.current = requestAnimationFrame(escanear)
      } catch (err) {
        detener()
        if (!activo) return
        const e = err as { name?: string }
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setEstado('denegado')
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setEstado('no-disponible')
        } else {
          setEstado('error')
        }
        console.error('Error iniciando cámara:', err)
      }
    })()

    return () => {
      activo = false
      detener()
    }
  }, [])

  return (
    <div className={`scanner ${estado === 'activa' ? 'scanner--activo' : ''}`}>
      <video ref={videoRef} className="scanner__video" playsInline muted />
      <div className="scanner__marco" aria-hidden="true">
        <span className="scanner__esquina scanner__esquina--tl" />
        <span className="scanner__esquina scanner__esquina--tr" />
        <span className="scanner__esquina scanner__esquina--bl" />
        <span className="scanner__esquina scanner__esquina--br" />
      </div>

      {estado !== 'activa' && (
        <div className="scanner__aviso">
          {estado === 'solicitando' && (
            <>
              <div className="carga__rueda carga__rueda--claro" aria-hidden="true" />
              <p>Solicitando cámara...</p>
            </>
          )}
          {estado === 'denegado' && <p>Permiso de cámara rechazado</p>}
          {estado === 'no-disponible' && <p>Cámara no disponible</p>}
          {estado === 'error' && <p>Error de cámara</p>}
        </div>
      )}
    </div>
  )
}