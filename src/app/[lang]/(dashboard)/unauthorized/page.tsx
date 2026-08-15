'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  return (
    <div
      style={{
        minHeight: '80dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
            background: 'rgba(245,158,11,0.12)',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          403 — Accès refusé
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Vous ne disposez pas des privilèges nécessaires pour accéder à cette page ou effectuer cette opération.
        </p>
        <Link href={`/${locale}/dashboard`} className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
