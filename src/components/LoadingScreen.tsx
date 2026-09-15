export default function LoadingScreen({ etiqueta = 'Cargando...' }: { etiqueta?: string }) {
  return (
    <div className="carga" role="status" aria-live="polite">
      <div className="carga__rueda" aria-hidden="true" />
      <p className="carga__texto">{etiqueta}</p>
    </div>
  )
}