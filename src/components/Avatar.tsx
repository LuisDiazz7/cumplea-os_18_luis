import { useEffect, useState } from 'react'
import { getFotoUrl } from '../services/storage'
import { iniciales } from '../lib/format'

interface AvatarProps {
  foto: string | null
  nombre: string
  tamano?: number
}

export default function Avatar({ foto, nombre, tamano = 52 }: AvatarProps) {
  const [cargado, setCargado] = useState<{ foto: string; url: string | null } | null>(null)
  const [fotoFallida, setFotoFallida] = useState<string | null>(null)

  useEffect(() => {
    if (!foto) return
    let activo = true
    getFotoUrl(foto).then((url) => {
      if (activo) setCargado({ foto, url })
    })
    return () => {
      activo = false
    }
  }, [foto])

  const url = cargado && cargado.foto === foto ? cargado.url : null
  const mostrarImagen = url !== null && fotoFallida !== foto
  const estilo = { width: tamano, height: tamano }

  if (mostrarImagen) {
    return (
      <img
        className="avatar"
        src={url ?? undefined}
        alt=""
        style={estilo}
        loading="lazy"
        onError={() => setFotoFallida(foto)}
      />
    )
  }

  return (
    <div className="avatar avatar--iniciales" style={estilo} aria-hidden="true">
      {iniciales(nombre)}
    </div>
  )
}