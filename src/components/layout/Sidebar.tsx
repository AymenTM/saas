'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  Banknote,
  Building2,
  UserCog,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react'

import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
  adminOnly?: boolean
}

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive =
    item.href === pathname ||
    (item.href !== '/' && pathname.includes(item.href.split('/').slice(-1)[0]))

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div style={{ paddingLeft: '1rem', marginTop: '0.25rem' }}>
            {item.children.map((child) => (
              <NavLink key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn('nav-link', isActive && 'active')}
      style={{ paddingLeft: depth > 0 ? '1.5rem' : undefined }}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { isSuperAdmin } = usePermissions()

  // Detect locale from path
  const locale = pathname.startsWith('/fr') ? 'fr' : 'en'
  const base = `/${locale}`

  const parkNavItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      href: `${base}/dashboard`,
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: 'Clients',
      href: `${base}/customers`,
      icon: <Users size={18} />,
    },
    {
      label: 'Véhicules',
      href: `${base}/vehicles`,
      icon: <Car size={18} />,
    },
    {
      label: 'Abonnements',
      href: `${base}/subscriptions`,
      icon: <CreditCard size={18} />,
    },
  ]

  const adminNavItems: NavItem[] = [
    {
      label: 'Sociétés',
      href: `${base}/admin/companies`,
      icon: <Building2 size={18} />,
    },
    {
      label: 'Utilisateurs',
      href: `${base}/admin/users`,
      icon: <Users size={18} />,
    },
  ]

  const navItems = isSuperAdmin ? adminNavItems : parkNavItems

  return (
    <div className="desktop-only" style={{ position: 'sticky', top: 0, height: '100vh' }}>
      <aside
        style={{
          width: '260px',
          height: '100%',
          minHeight: '100dvh',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              }}
            >
              <Car size={22} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.0625rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                ParkSub
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                Gestion abonnements
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            {navItems.map((item) => (
              <div key={item.href}>
                <NavLink item={item} />
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          © {new Date().getFullYear()} ParkSub SaaS
        </div>
      </aside>
    </div>
  )
}

