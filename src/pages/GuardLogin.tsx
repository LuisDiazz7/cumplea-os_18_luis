import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInGuardia,
  getGuardiaPorAuthId,
  signOutGuardia,
} from '../services/auth'
import { useGuard } from '../hooks/useGuard'
import { mensajeUsuario } from '../lib/errors'

export default function GuardLogin() {
  const { estado } = useGuard()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (estado === 'autorizado') navigate('/guardia', { replace: true })
  }, [estado, navigate])

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setEnviando(true)
    setError(null)

    try {
      console.log('---- Intento de inicio de sesión ----')
      const { usuarioId } = await signInGuardia(email.trim(), password)
      console.log('[Paso 2][OK] Sesión obtenida. usuarioId:', usuarioId)
      if (!usuarioId) {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
        setEnviando(false)
        return
      }

      const guardia = await getGuardiaPorAuthId(usuarioId)
      if (!guardia) {
        console.warn('[Paso 4][DENEGADO] El usuario Auth NO está en la tabla guardias. Cerrando sesión.')
        await signOutGuardia()
        setError('Acceso denegado. No tienes permisos de guardia.')
        setEnviando(false)
        return
      }

      console.log('[Paso 4][OK] Guardia autorizado:', { id: guardia.id, nombre: guardia.nombre })
      navigate('/guardia', { replace: true })
    } catch (err) {
      const e = err as { name?: string; message?: string; code?: string; status?: number }
      console.error('[Login][ERROR GENERAL]', {
        name: e.name,
        message: e.message,
        code: e.code,
        status: e.status,
        err,
      })
      setError(mensajeUsuario(err, 'No se pudo iniciar sesión. Verifica tus datos.'))
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
        <div className="login__titulo">
          <p className="eyebrow">Acceso de guardias</p>
          <h1 className="titulo">Bienvenido de nuevo</h1>
          <p className="subtitulo">Inicia sesión con tu cuenta para controlar los ingresos.</p>
        </div>

        <form className="formulario" onSubmit={manejarEnvio}>
          <label className="campo">
            <span className="campo__etiqueta">Correo</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>

          <label className="campo">
            <span className="campo__etiqueta">Contraseña</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="mensaje mensaje--error">{error}</p>}

          <button className="btn btn--primario btn--ancho" type="submit" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'INGRESAR'}
          </button>
        </form>
      </main>
    </div>
  )
}