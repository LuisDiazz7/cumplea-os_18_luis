import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, LogOut, Search } from 'lucide-react'
import { useGuard } from '../hooks/useGuard'
import { useRealtimeGuests } from '../hooks/useRealtimeGuests'
import StatCard from '../components/StatCard'
import GuestCard from '../components/GuestCard'
import LoadingScreen from '../components/LoadingScreen'

type Filtro = 'todos' | 'pendientes' | 'ingresaron'

export default function GuardDashboard() {
  const { guardia, signOut } = useGuard()
  const navigate = useNavigate()
  const { invitados, cargando, error } = useRealtimeGuests()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

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
                <GuestCard dato={dato} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}