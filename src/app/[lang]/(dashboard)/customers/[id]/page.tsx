'use client'

import { useEffect, useState, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getCustomerById } from '@/lib/actions/customers'
import { getVehiclesByCustomer } from '@/lib/actions/vehicles'
import { getSubscriptions } from '@/lib/actions/subscriptions'
import type { Customer, Vehicle, SubscriptionWithStatus } from '@/types'
import { formatDate, formatCurrency, statusColor } from '@/lib/utils'
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Car, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'

import MobileDataCard from '@/components/ui/MobileDataCard'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CustomerDetailPage({ params }: PageProps) {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'fr'
  const { id } = use(params)
  const { companyId } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId || !id) return

    async function loadData() {
      try {
        const [cust, vehs, allSubs] = await Promise.all([
          getCustomerById(id, companyId!),
          getVehiclesByCustomer(id, companyId!),
          getSubscriptions(companyId!),
        ])

        setCustomer(cust)
        setVehicles(vehs)
        setSubscriptions(allSubs.filter((s) => s.customerId === id))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, companyId])

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="card" style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Client introuvable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Ce client n&apos;existe pas ou a été supprimé.
        </p>
        <Link href={`/${locale}/customers`} className="btn btn-primary">
          <ArrowLeft size={16} /> Retour aux clients
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Back button */}
      <div>
        <Link href={`/${locale}/customers`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', minHeight: '38px', padding: '0.375rem 0.75rem' }}>
          <ArrowLeft size={16} /> Retour aux clients
        </Link>
      </div>

      {/* Customer Overview Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '0.875rem',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <User size={28} />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {customer.fullName}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} color="var(--brand)" /> {customer.phone}
              </div>
              {customer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={15} color="var(--brand)" /> {customer.email}
                </div>
              )}
              {customer.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={15} color="var(--brand)" /> {customer.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {customer.notes && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 0.875rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <strong>Notes : </strong> {customer.notes}
          </div>
        )}
      </div>

      {/* Vehicles Grid */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={18} color="var(--brand)" /> Véhicules ({vehicles.length})
          </h2>
          <Link href={`/${locale}/vehicles`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', minHeight: '36px', padding: '0.25rem 0.625rem' }}>
            <Plus size={14} /> Gérer
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Aucun véhicule associé à ce client.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {vehicles.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: '0.875rem',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand)', marginBottom: '0.25rem' }}>
                  {v.licensePlate}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {v.brand} {v.model}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Couleur : {v.color}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscriptions Section */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--brand)" /> Abonnements ({subscriptions.length})
          </h2>
          <Link href={`/${locale}/subscriptions`} className="btn btn-ghost" style={{ fontSize: '0.8125rem', minHeight: '36px', padding: '0.25rem 0.625rem' }}>
            <Plus size={14} /> Créer
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Aucun abonnement trouvé pour ce client.
          </p>
        ) : (
          <>
            {/* Mobile View */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subscriptions.map((s) => {
                const veh = vehicles.find((v) => v.id === s.vehicleId)
                return (
                  <MobileDataCard
                    key={s.id}
                    title={veh ? `${veh.licensePlate} (${veh.brand})` : 'N/A'}
                    subtitle={`Réf: ${s.token.slice(0, 8)}...`}
                    badge={
                      <span className={`badge ${statusColor(s.status)}`}>
                        {s.status === 'active' ? 'Actif' : s.status === 'expired' ? 'Expiré' : 'Annulé'}
                      </span>
                    }
                    fields={[
                      { label: 'Tarif', value: formatCurrency(s.price) },
                      { label: 'Début', value: formatDate(s.startDate, 'fr', 'dd/MM/yyyy') },
                      { label: 'Fin', value: formatDate(s.endDate, 'fr', 'dd/MM/yyyy') },
                    ]}
                    actions={
                      <Link
                        href={`/${locale}/subscriptions/${s.id}`}
                        className="btn btn-ghost"
                        style={{ padding: '0.375rem 0.75rem', minHeight: '36px', fontSize: '0.8125rem' }}
                      >
                        Voir détails
                      </Link>
                    }
                  />
                )
              })}
            </div>

            {/* Desktop View */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Véhicule</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Tarif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => {
                    const veh = vehicles.find((v) => v.id === s.vehicleId)
                    return (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand)' }}>
                          <Link href={`/${locale}/subscriptions/${s.id}`} style={{ color: 'inherit' }}>
                            {s.token.slice(0, 8)}...
                          </Link>
                        </td>
                        <td>{veh ? `${veh.licensePlate} (${veh.brand})` : 'N/A'}</td>
                        <td>{formatDate(s.startDate, 'fr', 'dd/MM/yyyy')}</td>
                        <td>{formatDate(s.endDate, 'fr', 'dd/MM/yyyy')}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(s.price)}</td>
                        <td>
                          <span className={`badge ${statusColor(s.status)}`}>
                            {s.status === 'active' ? 'Actif' : s.status === 'expired' ? 'Expiré' : 'Annulé'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

