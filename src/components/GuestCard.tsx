import type { InvitadoConEntrada } from '../types/database'
import Avatar from './Avatar'
import { formatearHora } from '../lib/format'

export default function GuestCard({ dato }: { dato: InvitadoConEntrada }) {
  const { invitado, entrada, guardia } = dato
  const estaAdentro = entrada !== null

  return (
    <article className={estaAdentro ? 'tarjeta-invitado tarjeta-invitado--adentro' : 'tarjeta-invitado'}>
      <Avatar foto={invitado.foto} nombre={invitado.nombre} tamano={52} />

      <div className="tarjeta-invitado__cuerpo">
        <h3 className="tarjeta-invitado__nombre">{invitado.nombre}</h3>

        {estaAdentro ? (
          <div className="tarjeta-invitado__detalle">
            <p className="tarjeta-invitado__linea">
              <span className="dot dot--verde" aria-hidden="true" />
              <strong className="tarjeta-invitado__estado">Ingresó</strong>
              <span className="tarjeta-invitado__hora">{formatearHora(entrada!.hora_entrada)}</span>
            </p>
            <p className="tarjeta-invitado__sub">
              Guardia: {guardia?.nombre ?? '—'}
              {entrada!.regalo ? ` · Regalo: ${entrada!.regalo}` : ''}
            </p>
          </div>
        ) : (
          <p className="tarjeta-invitado__detalle">
            <span className="dot dot--ambre" aria-hidden="true" />
            <strong className="tarjeta-invitado__estado">Pendiente</strong>
          </p>
        )}
      </div>
    </article>
  )
}