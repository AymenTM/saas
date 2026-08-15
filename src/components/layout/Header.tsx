'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  Menu,
  Car,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { initials } from '@/lib/utils'
import { toast } from 'sonner'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { userProfile, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const locale = pathname.startsWith('/fr') ? 'fr' : 'en'

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push(`/${locale}/login`)
    } catch {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  const roleBadge: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Administrateur',
    employee: 'Employé',
  }

  return (
    <header
      style={{
        height: '60px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.75rem',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >


      {/* Mobile Brand Title */}
      <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Car size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
          ParkSub
        </span>
      </div>

      {/* Desktop Search bar */}
      <div className="desktop-only" style={{ flex: 1, maxWidth: '380px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="search"
            placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
            className="input-base"
            style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.875rem' }}
            readOnly
          />
        </div>
      </div>

      {/* Header controls right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: 'auto' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-icon"
          style={{ height: '38px', width: '38px' }}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              minHeight: '38px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {userProfile ? initials(userProfile.name) : <User size={14} />}
            </div>
            <div className="desktop-only" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {userProfile?.name ?? 'Utilisateur'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {userProfile?.role ? roleBadge[userProfile.role] : ''}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {userMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className="card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '210px',
                  padding: '0.5rem',
                  zIndex: 50,
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {userProfile?.name ?? 'Utilisateur'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {userProfile?.email}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--danger)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

