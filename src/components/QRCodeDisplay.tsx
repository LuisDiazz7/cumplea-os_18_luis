import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import type { RefObject } from 'react'

interface QRCodeDisplayProps {
  valor: string
  canvasRef?: RefObject<HTMLCanvasElement | null>
}

export default function QRCodeDisplay({ valor, canvasRef }: QRCodeDisplayProps) {
  const internoRef = useRef<HTMLCanvasElement | null>(null)
  const objetivo = canvasRef ?? internoRef

  useEffect(() => {
    const lienzo = objetivo.current
    if (!lienzo) return
    QRCode.toCanvas(
      lienzo,
      valor,
      {
        width: 640,
        margin: 1,
        errorCorrectionLevel: 'high',
        color: { dark: '#0b0b10', light: '#ffffff' },
      },
      (error) => {
        if (error) console.error('Error generando QR:', error)
      },
    )
  }, [valor, objetivo])

  return <canvas ref={objetivo} className="qr-display" aria-label="Código QR de invitación" />
}