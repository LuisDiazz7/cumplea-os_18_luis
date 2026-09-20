import { useEffect, useState } from 'react'
import { getFotoUrl, getFotoUrlInvitado } from '../services/storage'
import { iniciales } from '../lib/format'

interface AvatarProps {
  foto: string | null
  nombre: string
  tamano?: number
  codigoQr?: string | null
}

export default function Avatar({ foto, nombre, tamano = 52, codigoQr = null }: AvatarProps) {
  const [cargado, setCargado] = useState<{ clave: string; url: string | null } | null>(null)
  const [fotoFallida, setFotoFallida] = useState<string | null>(null)

  const clave = codigoQr ?? foto

  useEffect(() => {
    if (!clave) return
    let activo = true
    const obtenerUrl = codigoQr ? getFotoUrlInvitado(codigoQr) : getFotoUrl(foto ?? '')
    obtenerUrl.then((url) => {
      if (!activo) return
      setCargado({ clave, url })
    })
    return () => {
      activo = false
    }
  }, [clave, codigoQr, foto])

  const url = cargado && cargado.clave === clave ? cargado.url : null
  const mostrarImagen = url !== null && fotoFallida !== clave
  const estilo = { width: tamano, height: tamano }

  if (mostrarImagen) {
    return (
      <img
        className="avatar"
        src={url ?? undefined}
        alt=""
        style={estilo}
        loading="lazy"
        onError={() => setFotoFallida(clave)}
      />
    )
  }

  return (
    <div className="avatar avatar--iniciales" style={estilo} aria-hidden="true">
      {iniciales(nombre)}
    </div>
  )
}