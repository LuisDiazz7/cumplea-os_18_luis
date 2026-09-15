import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { subirFoto } from '../services/storage'
import { crearInvitado } from '../services/guests'
import { mensajeUsuario } from '../lib/errors'

export default function GuestRegistration() {
  const navigate = useNavigate()
  const inputFotoRef = useRef<HTMLInputElement | null>(null)
  const [nombre, setNombre] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function manejarFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setError('El archivo seleccionado no es una imagen.')
      setFoto(null)
      setPreview(null)
      if (inputFotoRef.current) inputFotoRef.current.value = ''
      return
    }
    setError(null)
    setFoto(archivo)
    setPreview(URL.createObjectURL(archivo))
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return

    const nombreLimpio = nombre.trim()
    if (nombreLimpio.length < 2) {
      setError('Escribe tu nombre completo (mínimo 2 caracteres).')
      return
    }

    setEnviando(true)
    setError(null)

    try {
      let rutaFoto: string | null = null
      if (foto) {
        try {
          rutaFoto = await subirFoto(foto)
        } catch (err) {
          console.error('Error subiendo foto:', err)
          setError(mensajeUsuario(err, 'No se pudo subir tu foto. Inténtalo de nuevo.'))
          setEnviando(false)
          return
        }
      }

      const invitado = await crearInvitado(nombreLimpio, rutaFoto)
      sessionStorage.setItem('invitacion-luis-18', JSON.stringify(invitado))
      navigate('/invitado/qr', { replace: true })
    } catch (err) {
      setError(mensajeUsuario(err, 'No se pudo crear tu invitación. Inténtalo de nuevo.'))
      setEnviando(false)
    }
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <Link to="/" className="pagina__volver" aria-label="Volver al inicio">
          ←
        </Link>
      </header>

      <main className="pagina__contenido">
        <p className="eyebrow">Cumpleaños de Luis · 18</p>
        <h1 className="titulo">Genera tu invitación</h1>
        <p className="subtitulo">Solo necesitas tu nombre. La foto es opcional.</p>

        <form className="formulario" onSubmit={manejarEnvio}>
          <label className="campo">
            <span className="campo__etiqueta">Nombre</span>
            <input
              className="input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Escribe tu nombre completo"
              autoComplete="name"
              maxLength={120}
              required
            />
          </label>

          <label className="campo">
            <span className="campo__etiqueta">Foto (opcional)</span>
            <div className="campo__foto">
              <input
                ref={inputFotoRef}
                className="input-file"
                type="file"
                accept="image/*"
                onChange={manejarFoto}
              />
              {preview ? (
                <div className="foto-preview" role="img" aria-label="Vista previa de tu foto">
                  <img src={preview} alt="Vista previa de tu foto" />
                  <button
                    type="button"
                    className="foto-preview__quitar"
                    onClick={() => {
                      setFoto(null)
                      setPreview(null)
                      if (inputFotoRef.current) inputFotoRef.current.value = ''
                    }}
                  >
                    Quitar foto
                  </button>
                </div>
              ) : (
                <div className="foto-vacia">
                  <span className="foto-vacia__icono" aria-hidden="true">
                    +
                  </span>
                  <span>Seleccionar foto</span>
                </div>
              )}
            </div>
          </label>

          {error && <p className="mensaje mensaje--error">{error}</p>}

          <button className="btn btn--primario btn--ancho" type="submit" disabled={enviando}>
            {enviando ? 'Generando tu QR...' : 'CREAR MI QR'}
          </button>
        </form>
      </main>
    </div>
  )
}