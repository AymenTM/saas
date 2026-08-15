'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  value: string
  size?: number
}

export default function QRCodeDisplay({ value, size = 180 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch(console.error)
    }
  }, [value, size])

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: '0.75rem',
        background: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
