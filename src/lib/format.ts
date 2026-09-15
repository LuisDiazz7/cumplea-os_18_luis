export function formatearHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '--:--'
  return fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primera = partes[0][0] ?? ''
  const segunda = partes.length > 1 ? (partes[partes.length - 1][0] ?? '') : ''
  return (primera + segunda).toUpperCase()
}