import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, CircleCheck, ShieldAlert } from 'lucide-react'
import QRScanner from '../components/QRScanner'
import Avatar from '../components/Avatar'
import LoadingScreen from '../components/LoadingScreen'
import { useGuard } from '../hooks/useGuard'
import { getInvitadoPorCodigo } from '../services/guests'
import { getEntradaDeInvitado, registrarEntrada } from '../services/entries'
import { getGuardiaPorId } from '../services/auth'
import { mensajeUsuario } from '../lib/errors'
import { formatearHora } from '../lib/format'
import type { Entrada, Guardia, Invitado } from '../types/database'

type Fase =
  | 'escaneando'
  | 'buscando'
  | 'invitado'
  | 'invalido'
  | 'ya-utilizado'
  | 'registrando'
  | 'registrado'
  | 'error'

export default function GuardScanner() {
  const { guardia } = useGuard()
  const navigate = useNavigate()
  const [fase, setFase] = useState<Fase>('escaneando')
  const [scanKey, setScanKey] = useState(0)
  const [invitadoActual, setInvitadoActual] = useState<Invitado | null>(null)
  const [entradaActual, setEntradaActual] = useState<Entrada | null>(null)
  const [guardiaEntrada, setGuardiaEntrada] = useState<Guardia | null>(null)
  const [regalo, setRegalo] = useState('')
  const [mensaje, setMensaje] = useState('')

  function reiniciar() {
    setFase('escaneando')
    setInvitadoActual(null)
    setEntradaActual(null)
    setGuardiaEntrada(null)
    setRegalo('')
    setMensaje('')
    setScanKey((k) => k + 1)
  }

  async function manejarCodigo(codigo: string) {
    setFase('buscando')
    setInvitadoActual(null)
    setEntradaActual(null)
    setGuardiaEntrada(null)
    setRegalo('')
    setMensaje('')

    try {
      const invitado = await getInvitadoPorCodigo(codigo.trim())
      if (!invitado) {
        setFase('invalido')
        return
      }
      setInvitadoActual(invitado)

      const entrada = await getEntradaDeInvitado(invitado.id)
      if (entrada) {
        const guardiaEnt = await getGuardiaPorId(entrada.guardia_id).catch(() => null)
        setEntradaActual(entrada)
        setGuardiaEntrada(guardiaEnt)
        setFase('ya-utilizado')
        return
      }
      setFase('invitado')
    } catch (err) {
      console.error('Error procesando QR:', err)
      setMensaje(mensajeUsuario(err, 'No se pudo validar el código. Inténtalo de nuevo.'))
      setFase('error')
    }
  }

  async function confirmarEntrada() {
    if (!invitadoActual || !guardia) return
    setFase('registrando')

    try {
      const nueva = await registrarEntrada(invitadoActual.id, guardia.id, regalo)
      setEntradaActual(nueva)
      setFase('registrado')
    } catch (err) {
      const e = err as { code?: string }
      if (e.code === '23505') {
        const entrada = await getEntradaDeInvitado(invitadoActual.id).catch(() => null)
        const guardiaEnt = entrada
          ? await getGuardiaPorId(entrada.guardia_id).catch(() => null)
          : null
        setEntradaActual(entrada)
        setGuardiaEntrada(guardiaEnt)
        setFase('ya-utilizado')
        return
      }
      console.error('Error registrando entrada:', err)
      setMensaje(mensajeUsuario(err, 'No se pudo registrar la entrada. Inténtalo de nuevo.'))
      setFase('error')
    }
  }

  if (fase === 'buscando' || fase === 'registrando') {
    return (
      <div className="pagina">
        <LoadingScreen
          etiqueta={fase === 'buscando' ? 'Validando código...' : 'Registrando entrada...'}
        />
      </div>
    )
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        {fase === 'escaneando' ? (
          <button className="pagina__volver" onClick={() => navigate('/guardia')} aria-label="Volver al panel">
            ←
          </button>
        ) : (
          <button className="pagina__volver" onClick={reiniciar} aria-label="Volver a escanear">
            ←
          </button>
        )}
        <span className="pagina__cabecera-titulo">Escanear QR</span>
      </header>

      <main className="pagina__contenido">
        {fase === 'escaneando' && (
          <>
            <p className="escaneo__instruccion">Apunta la cámara al QR del invitado</p>
            <QRScanner key={scanKey} onScan={manejarCodigo} />
          </>
        )}

        {fase === 'invalido' && (
          <div className="resultado resultado--invalido">
            <ShieldAlert size={56} className="resultado__icono" aria-hidden="true" />
            <h2 className="resultado__titulo">QR NO VÁLIDO</h2>
            <p className="resultado__texto">Este código no pertenece a ningún invitado.</p>
            <button className="btn btn--primario btn--ancho" onClick={reiniciar}>
              ESCANEAR OTRO
            </button>
          </div>
        )}

        {fase === 'ya-utilizado' && entradaActual && (
          <div className="resultado resultado--usado">
            <CircleAlert size={56} className="resultado__icono" aria-hidden="true" />
            <h2 className="resultado__titulo">QR YA UTILIZADO</h2>
            <p className="resultado__nombre">{invitadoActual?.nombre ?? 'Invitado'}</p>
            <div className="resultado__datos">
              <p>
                <span className="resultado__clave">Ingresó a las:</span>
                <span className="resultado__valor">{formatearHora(entradaActual.hora_entrada)}</span>
              </p>
              <p>
                <span className="resultado__clave">Escaneado por:</span>
                <span className="resultado__valor">{guardiaEntrada?.nombre ?? '—'}</span>
              </p>
              <p>
                <span className="resultado__clave">Regalo:</span>
                <span className="resultado__valor">{entradaActual.regalo ?? 'Sin regalo'}</span>
              </p>
            </div>
            <button className="btn btn--primario btn--ancho" onClick={reiniciar}>
              ESCANEAR OTRO
            </button>
          </div>
        )}

        {fase === 'invitado' && invitadoActual && (
          <div className="confirmacion">
            <div className="confirmacion__invitado">
              <Avatar foto={invitadoActual.foto} nombre={invitadoActual.nombre} tamano={88} />
              <h2 className="confirmacion__nombre">{invitadoActual.nombre}</h2>
              <p className="confirmacion__valido">
                <CircleCheck size={20} aria-hidden="true" />
                Invitación válida
              </p>
            </div>

            <label className="campo">
              <span className="campo__etiqueta">Regalo (opcional)</span>
              <input
                className="input"
                type="text"
                value={regalo}
                onChange={(e) => setRegalo(e.target.value)}
                placeholder="Ej: Perfume, polera, dinero..."
                maxLength={200}
              />
            </label>

            <button className="btn btn--primario btn--ancho" onClick={confirmarEntrada}>
              CONFIRMAR ENTRADA
            </button>
            <button className="btn btn--fantasma btn--ancho" onClick={reiniciar}>
              CANCELAR
            </button>
          </div>
        )}

        {fase === 'registrado' && entradaActual && (
          <div className="resultado resultado--ok">
            <CircleCheck size={60} className="resultado__icono" aria-hidden="true" />
            <h2 className="resultado__titulo">ENTRADA REGISTRADA</h2>
            <p className="resultado__nombre">{invitadoActual?.nombre ?? 'Invitado'}</p>
            <p className="resultado__hora">{formatearHora(entradaActual.hora_entrada)}</p>
            <button className="btn btn--primario btn--ancho" onClick={reiniciar}>
              ESCANEAR SIGUIENTE
            </button>
          </div>
        )}

        {fase === 'error' && (
          <div className="resultado resultado--error">
            <CircleAlert size={56} className="resultado__icono" aria-hidden="true" />
            <h2 className="resultado__titulo">Hubo un problema</h2>
            <p className="resultado__texto">{mensaje}</p>
            <div className="resultado__acciones">
              <button className="btn btn--primario btn--ancho" onClick={reiniciar}>
                REINTENTAR
              </button>
              <Link to="/guardia" className="btn btn--fantasma btn--ancho">
                VOLVER AL PANEL
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}