import { useEffect } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Invitado } from '../types/database'

interface ConfirmarEliminacionProps {
  invitado: Invitado
  eliminando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

export default function ConfirmarEliminacion({
  invitado,
  eliminando,
  onCancelar,
  onConfirmar,
}: ConfirmarEliminacionProps) {
  useEffect(() => {
    if (eliminando) return
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [eliminando, onCancelar])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirmar-eliminar-titulo">
      <div className="modal__fondo" onClick={onCancelar} aria-hidden="true" />

      <div className="modal__caja">
        <button
          type="button"
          className="modal__cerrar"
          onClick={onCancelar}
          aria-label="Cerrar"
          title="Cerrar"
          disabled={eliminando}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="modal__icono" aria-hidden="true">
          <Trash2 size={26} />
        </div>

        <h2 id="confirmar-eliminar-titulo" className="modal__titulo">
          ¿Eliminar a {invitado.nombre}?
        </h2>
        <p className="modal__texto">Esta acción eliminará al invitado y su registro de entrada si existe.</p>

        <div className="modal__acciones">
          <button type="button" className="btn btn--fantasma" onClick={onCancelar} disabled={eliminando}>
            CANCELAR
          </button>
          <button type="button" className="btn btn--peligro" onClick={onConfirmar} disabled={eliminando}>
            {eliminando ? 'ELIMINANDO...' : 'ELIMINAR'}
          </button>
        </div>
      </div>
    </div>
  )
}