'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSubscriptions } from '@/lib/actions/subscriptions'
import { getCustomers } from '@/lib/actions/customers'
import { getVehicles } from '@/lib/actions/vehicles'
import { getPayments } from '@/lib/actions/payments'
import type { SubscriptionWithStatus, Customer, Vehicle, Payment } from '@/types'
import { formatCurrency, formatDate, isExpiringSoon, statusColor } from '@/lib/utils'
import {
  CreditCard,
  AlertCircle,
  Clock,
  Users,
  Car,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton'

import MobileDataCard from '@/components/ui/MobileDataCard'

export default function DashboardPage() {
  const { companyId } = useAuth()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    let isMounted = true
    const controller = new AbortController()

    async function loadData() {
      try {
        const [subs, custs, vehs, pays] = await Promise.all([
          getSubscriptions(companyId!),
          getCustomers(companyId!),
          getVehicles(companyId!),
          getPayments(companyId!),
        ])

        if (isMounted) {
          setSubscriptions(subs)
          setCustomers(custs)
          setVehicles(vehs)
          setPayments(pays)
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error loading dashboard data:', err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [companyId])

  // Computed metrics
  const activeCount = useMemo(
    () => subscriptions.filter((s) => s.status === 'active').length,
    [subscriptions]
  )
  const expiredCount = useMemo(
    () => subscriptions.filter((s) => s.status === 'expired').length,
    [subscriptions]
  )
  const expiringSoonList = useMemo(
    () => subscriptions.filter((s) => s.status === 'active' && isExpiringSoon(s.endDate, 7)),
    [subscriptions]
  )

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyRevenue = useMemo(() => {
    return payments
      .filter((p) => {
        const d = new Date(p.paymentDate as unknown as string)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments, currentMonth, currentYear])

  const yearlyRevenue = useMemo(() => {
    return payments
      .filter((p) => {
        const d = new Date(p.paymentDate as unknown as string)
        return d.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments, currentYear])

  // Chart data: Monthly breakdown over last 6 months
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const result = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthIdx = d.getMonth()
      const year = d.getFullYear()

      const subsCount = subscriptions.filter((s) => {
        const sd = new Date(s.createdAt as unknown as string)
        return sd.getMonth() === monthIdx && sd.getFullYear() === year
      }).length

      const rev = payments
        .filter((p) => {
          const pd = new Date(p.paymentDate as unknown as string)
          return pd.getMonth() === monthIdx && pd.getFullYear() === year
        })
        .reduce((sum, p) => sum + p.amount, 0)

      result.push({
        month: months[monthIdx],
        subscriptions: subsCount,
        revenue: rev,
      })
    }

    return result
  }, [subscriptions, payments])

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <h1 className="page-title">Tableau de bord</h1>
        <StatCardSkeleton />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Abonnements actifs',
      value: activeCount,
      icon: <CreditCard size={18} color="#10b981" />,
      color: 'var(--success)',
      bgColor: 'rgba(16,185,129,0.12)',
    },
    {
      title: 'Abonnements expirés',
      value: expiredCount,
      icon: <AlertCircle size={18} color="#f43f5e" />,
      color: 'var(--danger)',
      bgColor: 'rgba(244,63,94,0.12)',
    },
    {
      title: 'Expire dans 7 jours',
      value: expiringSoonList.length,
      icon: <Clock size={18} color="#f59e0b" />,
      color: 'var(--warning)',
      bgColor: 'rgba(245,158,11,0.12)',
    },
    {
      title: 'Clients',
      value: customers.length,
      icon: <Users size={18} color="#6366f1" />,
      color: 'var(--brand)',
      bgColor: 'rgba(99,102,241,0.12)',
    },
    {
      title: 'Véhicules',
      value: vehicles.length,
      icon: <Car size={18} color="#38bdf8" />,
      color: 'var(--info)',
      bgColor: 'rgba(56,189,248,0.12)',
    },
    {
      title: 'Chiffre d\'affaires mensuel',
      value: formatCurrency(monthlyRevenue),
      icon: <Banknote size={18} color="#10b981" />,
      color: 'var(--success)',
      bgColor: 'rgba(16,185,129,0.12)',
    },
    {
      title: 'Chiffre d\'affaires annuel',
      value: formatCurrency(yearlyRevenue),
      icon: <TrendingUp size={18} color="#6366f1" />,
      color: 'var(--brand)',
      bgColor: 'rgba(99,102,241,0.12)',
    },
  ]

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Title & Action */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Aperçu global de votre activité de stationnement
          </p>
        </div>
        <Link href={`/${locale}/subscriptions`} className="btn btn-primary" style={{ width: 'auto' }}>
          <CreditCard size={18} />
          <span>Nouvel abonnement</span>
        </Link>
      </div>

      {/* Notifications Banners */}
      {expiringSoonList.length > 0 && (
        <div
          style={{
            padding: '0.875rem 1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.875rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {expiringSoonList.length} abonnement(s) expirent sous 7 jours
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Pensez à relancer les clients pour leur renouvellement.
              </span>
            </div>
          </div>
          <Link href={`/${locale}/subscriptions`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', minHeight: '36px' }}>
            Voir <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {statCards.map((card, idx) => (
          <div key={idx} className="card stat-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {card.title}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  background: card.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Monthly Subscriptions */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Évolution des abonnements (6 derniers mois)
          </h3>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                  }}
                />
                <Bar dataKey="subscriptions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Abonnements" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Overview */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Évolution du chiffre d&apos;affaires (DA)
          </h3>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                  }}
                  formatter={(value: any) => [`${value} DA`, 'Revenu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" name="Revenu (DA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Abonnements récents
          </h3>
          <Link href={`/${locale}/subscriptions`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', minHeight: '36px', padding: '0.375rem 0.75rem' }}>
            Voir tout
          </Link>
        </div>

        {/* Mobile View: Data Cards */}
        <div className="mobile-only" style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {subscriptions.slice(0, 5).map((sub) => {
            const customer = customers.find((c) => c.id === sub.customerId)
            const vehicle = vehicles.find((v) => v.id === sub.vehicleId)

            return (
              <MobileDataCard
                key={sub.id}
                title={customer?.fullName || 'N/A'}
                subtitle={sub.token.slice(0, 8) + '...'}
                badge={
                  <span className={`badge ${statusColor(sub.status)}`}>
                    {sub.status === 'active' ? 'Actif' : sub.status === 'expired' ? 'Expiré' : 'Annulé'}
                  </span>
                }
                fields={[
                  { label: 'Véhicule', value: vehicle ? `${vehicle.licensePlate} (${vehicle.brand})` : 'N/A' },
                  { label: 'Prix', value: formatCurrency(sub.price) },
                  { label: 'Début', value: formatDate(sub.startDate, 'fr', 'dd/MM/yy') },
                  { label: 'Fin', value: formatDate(sub.endDate, 'fr', 'dd/MM/yy') },
                ]}
              />
            )
          })}
          {subscriptions.length === 0 && (

            <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Aucun abonnement trouvé.
            </p>
          )}
        </div>

        {/* Desktop View: Data Table */}
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Période</th>
                <th>Prix</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.slice(0, 5).map((sub) => {
                const customer = customers.find((c) => c.id === sub.customerId)
                const vehicle = vehicles.find((v) => v.id === sub.vehicleId)

                return (
                  <tr key={sub.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand)' }}>
                      {sub.token.slice(0, 8)}...
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {customer?.fullName || 'N/A'}
                    </td>
                    <td>
                      {vehicle ? (
                        <span>
                          <strong style={{ color: 'var(--text-primary)' }}>{vehicle.licensePlate}</strong> ({vehicle.brand})
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {formatDate(sub.startDate, 'fr', 'dd/MM/yyyy')} → {formatDate(sub.endDate, 'fr', 'dd/MM/yyyy')}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(sub.price)}
                    </td>
                    <td>
                      <span className={`badge ${statusColor(sub.status)}`}>
                        {sub.status === 'active' ? 'Actif' : sub.status === 'expired' ? 'Expiré' : 'Annulé'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucun abonnement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

