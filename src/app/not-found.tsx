'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
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
            background: 'rgba(99,102,241,0.12)',
            color: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <FileQuestion size={32} />
        </div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          404 — Page introuvable
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link href={`/${locale}/dashboard`} className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <Home size={16} /> Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
