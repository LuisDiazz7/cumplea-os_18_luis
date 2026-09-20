import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, LogOut, Search } from 'lucide-react'
import { useGuard } from '../hooks/useGuard'
import { useRealtimeGuests } from '../hooks/useRealtimeGuests'
import { eliminarInvitado } from '../services/guests'
import { eliminarFoto } from '../services/storage'
import { mensajeUsuario } from '../lib/errors'
import StatCard from '../components/StatCard'
import GuestCard from '../components/GuestCard'
import ConfirmarEliminacion from '../components/ConfirmarEliminacion'
import LoadingScreen from '../components/LoadingScreen'
import type { Invitado } from '../types/database'

type Filtro = 'todos' | 'pendientes' | 'ingresaron'

interface Feedback {
  tipo: 'ok' | 'error'
  texto: string
}

export default function GuardDashboard() {
  const { guardia, signOut } = useGuard()
  const navigate = useNavigate()
  const { invitados, cargando, error, quitarInvitadoLocal } = useRealtimeGuests()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [invitadoAEliminar, setInvitadoAEliminar] = useState<Invitado | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const total = invitados.length
  const ingresaron = invitados.filter((g) => g.entrada).length
  const pendientes = total - ingresaron

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return invitados.filter((dato) => {
      if (q && !dato.invitado.nombre.toLowerCase().includes(q)) return false
      if (filtro === 'pendientes' && dato.entrada) return false
      if (filtro === 'ingresaron' && !dato.entrada) return false
      return true
    })
  }, [invitados, busqueda, filtro])

  async function cerrarSesion() {
    await signOut()
    navigate('/guardia/login', { replace: true })
  }

  function manejarBusqueda(e: ChangeEvent<HTMLInputElement>) {
    setBusqueda(e.target.value)
  }

  const confirmarEliminacion = useCallback(async () => {
    if (!invitadoAEliminar) return
    const invitado = invitadoAEliminar

    setEliminando(true)
    setFeedback(null)

    try {
      await eliminarInvitado(invitado.id)
      let notaFoto = ''
      if (invitado.foto) {
        try {
          await eliminarFoto(invitado.foto)
        } catch (e) {
          const se = e as { message?: string; name?: string; statusCode?: number; cause?: unknown }
          console.warn(
            '[Eliminar][AVISO] No se pudo borrar la foto del storage:',
            {
              name: se.name,
              message: se.message,
              statusCode: se.statusCode,
              cause: se.cause,
              ruta: invitado.foto,
            },
          )
          notaFoto = ' (la foto no se pudo borrar del almacenamiento)'
        }
      }
      quitarInvitadoLocal(invitado.id)
      setFeedback({ tipo: 'ok', texto: `Invitado "${invitado.nombre}" eliminado.${notaFoto}` })
    } catch (e) {
      const se = e as { code?: string; message?: string; details?: string; hint?: string; name?: string }
      console.error('[Eliminar][ERROR] No se pudo eliminar al invitado:', {
        code: se.code,
        message: se.message,
        details: se.details,
        hint: se.hint,
        name: se.name,
      })
      setFeedback({
        tipo: 'error',
        texto: mensajeUsuario(e, 'No se pudo eliminar al invitado. Inténtalo de nuevo.'),
      })
    } finally {
      setEliminando(false)
      setInvitadoAEliminar(null)
    }
  }, [invitadoAEliminar, quitarInvitadoLocal])

  const cancelarEliminacion = useCallback(() => {
    if (eliminando) return
    setInvitadoAEliminar(null)
  }, [eliminando])

  if (cargando) return <LoadingScreen etiqueta="Cargando invitados..." />

  return (
    <div className="panel">
      <header className="panel__cabecera">
        <div>
          <p className="panel__evento">Cumpleaños Luis</p>
          <p className="panel__edad">18 · Control de invitados</p>
        </div>
        <button className="btn-icono" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={16} aria-hidden="true" />
          Salir
        </button>
      </header>

      <main className="panel__contenido">
        <p className="panel__saludo">
          Hola, <strong>{guardia?.nombre ?? 'guardia'}</strong>
        </p>

        <div className="panel__stats">
          <StatCard etiqueta="REGISTRADOS" valor={total} tono="oro" />
          <StatCard etiqueta="INGRESARON" valor={ingresaron} tono="verde" />
          <StatCard etiqueta="PENDIENTES" valor={pendientes} tono="neutro" />
        </div>

        <button className="btn btn--primario btn--grande btn--ancho" onClick={() => navigate('/guardia/escanear')}>
          <Camera size={22} aria-hidden="true" />
          ESCANEAR QR
        </button>

        <div className="panel__busqueda">
          <div className="campo-busqueda">
            <Search size={18} className="campo-busqueda__icono" aria-hidden="true" />
            <input
              className="input"
              type="search"
              value={busqueda}
              onChange={manejarBusqueda}
              placeholder="Buscar invitado..."
              aria-label="Buscar invitado"
            />
          </div>
        </div>

        <div className="filtros" role="tablist" aria-label="Filtrar invitados">
          {(
            [
              ['todos', 'Todos'],
              ['pendientes', 'Pendientes'],
              ['ingresaron', 'Ingresaron'],
            ] as [Filtro, string][]
          ).map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              className={filtro === valor ? 'filtro filtro--activo' : 'filtro'}
              onClick={() => setFiltro(valor)}
              role="tab"
              aria-selected={filtro === valor}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        {error && <p className="mensaje mensaje--error">{error}</p>}

        {filtrados.length === 0 ? (
          <div className="vacio">
            <p className="vacio__titulo">
              {invitados.length === 0
                ? 'Aún no hay invitados registrados'
                : 'No hay invitados que coincidan'}
            </p>
            <p className="vacio__sub">
              {invitados.length === 0 ? 'Cuando alguien cree su QR aparecerá aquí al instante.' : 'Prueba con otra búsqueda o filtro.'}
            </p>
          </div>
        ) : (
          <ul className="lista-invitados" aria-label="Lista de invitados">
            {filtrados.map((dato) => (
              <li key={dato.invitado.id}>
                <GuestCard dato={dato} onEliminar={setInvitadoAEliminar} />
              </li>
            ))}
          </ul>
        )}
      </main>

      {feedback && (
        <div className={`toast toast--${feedback.tipo}`} role="status" aria-live="polite">
          {feedback.texto}
        </div>
      )}

      {invitadoAEliminar && (
        <ConfirmarEliminacion
          invitado={invitadoAEliminar}
          eliminando={eliminando}
          onCancelar={cancelarEliminacion}
          onConfirmar={confirmarEliminacion}
        />
      )}
    </div>
  )
}