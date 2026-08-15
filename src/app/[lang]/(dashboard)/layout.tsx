'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, role, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    const locale = pathname.startsWith('/fr') ? 'fr' : 'en'

    if (!user) {
      router.push(`/${locale}/login`)
      return
    }

    if (userProfile && userProfile.isActive === false) {
      logout()
      router.push(`/${locale}/login`)
      return
    }

    if (role === 'super_admin') {
      // Super Admin does not manage parks - restrict to /admin section
      if (!pathname.includes('/admin')) {
        router.push(`/${locale}/admin/companies`)
      }
    } else if (role) {
      // Park operators cannot access super admin pages
      if (pathname.includes('/admin')) {
        router.push(`/${locale}/unauthorized`)
      }
    }
  }, [user, userProfile, role, loading, logout, router, pathname])


  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2
            size={40}
            color="var(--brand)"
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: 'var(--bg)',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header />
        <main
          style={{
            flex: 1,
            padding: '1rem',
            paddingBottom: 'calc(5rem + var(--safe-bottom))',
            overflowY: 'auto',
          }}
        >
          <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

