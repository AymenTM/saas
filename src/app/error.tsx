'use client'

import { useEffect } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '1.5rem',
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244,63,94,0.12)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <AlertOctagon size={32} />
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          500 — Erreur système
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Une erreur inattendue est survenue. Veuillez réanalyser la requête.
        </p>
        <button onClick={() => reset()} className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    </div>
  )
}
