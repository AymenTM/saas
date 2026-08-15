'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Car,
  UserCog,
  Building2,
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

export default function BottomNav() {
  const pathname = usePathname()
  const { isSuperAdmin } = usePermissions()

  const locale = pathname.startsWith('/fr') ? 'fr' : 'en'
  const base = `/${locale}`

  const isMoreActive =
    pathname.includes('/vehicles') ||
    pathname.includes('/admin')

  const parkMainItems = [
    {
      label: locale === 'fr' ? 'Accueil' : 'Home',
      href: `${base}/dashboard`,
      icon: <LayoutDashboard size={20} />,
      isActive: pathname === `${base}/dashboard` || pathname === `${base}`,
    },
    {
      label: locale === 'fr' ? 'Clients' : 'Customers',
      href: `${base}/customers`,
      icon: <Users size={20} />,
      isActive: pathname.includes('/customers'),
    },
    {
      label: locale === 'fr' ? 'Véhicules' : 'Vehicles',
      href: `${base}/vehicles`,
      icon: <Car size={20} />,
      isActive: pathname.includes('/vehicles'),
    },
    {
      label: locale === 'fr' ? 'Abonnements' : 'Subscriptions',
      href: `${base}/subscriptions`,
      icon: <CreditCard size={20} />,
      isActive: pathname.includes('/subscriptions'),
    },
  ]

  const adminMainItems = [
    {
      label: locale === 'fr' ? 'Sociétés' : 'Companies',
      href: `${base}/admin/companies`,
      icon: <Building2 size={20} />,
      isActive: pathname.includes('/admin/companies'),
    },
    {
      label: locale === 'fr' ? 'Utilisateurs' : 'Users',
      href: `${base}/admin/users`,
      icon: <UserCog size={20} />,
      isActive: pathname.includes('/admin/users'),
    },
  ]

  const mainItems = isSuperAdmin ? adminMainItems : parkMainItems

  return (
    <nav className="bottom-nav mobile-only" aria-label="Navigation principale mobile">
      {mainItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bottom-nav-item ${item.isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
