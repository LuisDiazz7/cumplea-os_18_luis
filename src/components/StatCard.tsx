interface StatCardProps {
  etiqueta: string
  valor: number
  tono: 'oro' | 'verde' | 'neutro'
}

export default function StatCard({ etiqueta, valor, tono }: StatCardProps) {
  return (
    <div className={tono === 'oro' ? 'tarjeta-stat tarjeta-stat--oro' : tono === 'verde' ? 'tarjeta-stat tarjeta-stat--verde' : 'tarjeta-stat'}>
      <span className="tarjeta-stat__valor">{valor}</span>
      <span className="tarjeta-stat__etiqueta">{etiqueta}</span>
    </div>
  )
}